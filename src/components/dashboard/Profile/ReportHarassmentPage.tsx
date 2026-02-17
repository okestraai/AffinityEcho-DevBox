import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Lock, CheckCircle, FileText, User, Calendar, MapPin, Loader2 } from 'lucide-react';
import { SubmitHarassmentReport } from '../../../../api/profileApis';
import { showToast } from '../../../Helper/ShowToast';

export function ReportHarassmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    incidentType: '',
    description: '',
    date: '',
    location: '',
    witnesses: '',
    evidence: '',
    reporterType: 'anonymous',
    contactEmail: '',
    immediateRisk: false
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const incidentTypes = [
    'Racial discrimination',
    'Gender-based harassment',
    'Sexual harassment',
    'Hostile work environment',
    'Retaliation',
    'Bullying',
    'Microaggressions',
    'Other'
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const reporterType = formData.reporterType === 'anonymous' ? 'other' as const : 'victim' as const;
      const response = await SubmitHarassmentReport({
        incidentType: formData.incidentType,
        description: formData.description,
        date: formData.date || undefined,
        location: formData.location || undefined,
        witnesses: formData.witnesses || undefined,
        evidence: formData.evidence || undefined,
        reporterType,
        contactEmail: formData.contactEmail || undefined,
        immediateRisk: formData.immediateRisk
      });
      if (response.data?.referenceNumber) {
        setReferenceNumber(response.data.referenceNumber);
      }
      if (response.message) {
        setResponseMessage(response.message);
      }
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast('Failed to submit report. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Report Submitted Successfully
            </h2>

            <p className="text-gray-600 mb-6">
              {responseMessage || 'Your report has been received and will be reviewed by our safety team within 24 hours.'}
            </p>

            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Reference Number</h3>
              <p className="text-2xl font-mono text-blue-600">{referenceNumber || `HR-${Date.now().toString().slice(-8)}`}</p>
              <p className="text-sm text-gray-600 mt-2">
                Save this number to check the status of your report
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 text-left">
                <Lock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Your privacy is protected</p>
                  <p className="text-sm text-gray-600">
                    {formData.reporterType === 'anonymous'
                      ? 'Your identity will remain completely anonymous'
                      : 'Your contact information is kept strictly confidential'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-left">
                <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Protected from retaliation</p>
                  <p className="text-sm text-gray-600">
                    Reporting is protected under company policy and employment law
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard/profile')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Return to Profile
              </button>

              <button
                onClick={() => navigate('/crisis-resources')}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                View Support Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Report Harassment</h1>
            </div>
            <p className="text-red-100">
              Safe, confidential reporting for workplace harassment and discrimination
            </p>
          </div>

          <div className="p-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Immediate Danger</h3>
                  <p className="text-sm text-red-700 mb-2">
                    If you are in immediate danger, please call 911 or your local emergency services.
                  </p>
                  <p className="text-sm text-red-700">
                    For urgent mental health support: <strong>988 Suicide & Crisis Lifeline</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className="w-4" />
                <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className="w-4" />
                <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              </div>
              <div className="flex justify-between text-sm">
                <span className={step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Incident Details</span>
                <span className={step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Description</span>
                <span className={step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}>Contact Info</span>
              </div>
            </div>

            <div className="space-y-6">
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type of Incident *
                    </label>
                    <select
                      value={formData.incidentType}
                      onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select incident type</option>
                      {incidentTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date of Incident *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Conference Room B, 3rd Floor"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="immediateRisk"
                      checked={formData.immediateRisk}
                      onChange={(e) => setFormData({ ...formData, immediateRisk: e.target.checked })}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <label htmlFor="immediateRisk" className="text-sm text-gray-700">
                      This incident involves immediate physical risk or ongoing harassment
                    </label>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Detailed Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Please describe what happened in as much detail as you're comfortable sharing. Include dates, times, names, and specific behaviors or statements..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[200px]"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Be as specific as possible. This helps us take appropriate action.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Witnesses (if any)
                    </label>
                    <textarea
                      value={formData.witnesses}
                      onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                      placeholder="Names of anyone who witnessed the incident..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evidence
                    </label>
                    <textarea
                      value={formData.evidence}
                      onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                      placeholder="Describe any evidence you have (emails, messages, documents, etc.). Do not include actual files or attachments in this form."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      How would you like to submit this report?
                    </label>

                    <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        value="anonymous"
                        checked={formData.reporterType === 'anonymous'}
                        onChange={(e) => setFormData({ ...formData, reporterType: e.target.value })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Anonymous Report</div>
                        <div className="text-sm text-gray-600">
                          Your identity will remain completely confidential. You won't be contacted about this report.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        value="confidential"
                        checked={formData.reporterType === 'confidential'}
                        onChange={(e) => setFormData({ ...formData, reporterType: e.target.value })}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Confidential Report</div>
                        <div className="text-sm text-gray-600">
                          Your identity is protected, but HR may contact you for additional information if needed.
                        </div>
                      </div>
                    </label>
                  </div>

                  {formData.reporterType === 'confidential' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="your.email@company.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={formData.reporterType === 'confidential'}
                      />
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>Your report is reviewed by trained HR professionals within 24 hours</span>
                      </li>
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>An investigation is opened and handled with strict confidentiality</span>
                      </li>
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>Appropriate action is taken based on findings</span>
                      </li>
                      <li className="flex gap-2">
                        <span>•</span>
                        <span>You are protected from retaliation under company policy and law</span>
                      </li>
                    </ul>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-6 border-t">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.incidentType || !formData.description}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
