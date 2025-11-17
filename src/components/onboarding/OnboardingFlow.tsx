import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Users, Briefcase, Heart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DemographicsStep } from './DemographicsStep';
import { CompanyStep } from './CompanyStep';
import { AffinityStep } from './AffinityStep';

// Logging utility for consistent formatting
const log = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${timestamp}] [OnboardingFlow.${component}] ${message}:`, data);
  } else {
    console.log(`[${timestamp}] [OnboardingFlow.${component}] ${message}`);
  }
};

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    race: '',
    gender: '',
    careerLevel: '',
    company: '',
    affinityTags: [] as string[]
  });
  const { completeOnboarding } = useAuth();

  const steps = [
    {
      title: 'Tell us about yourself',
      subtitle: 'This helps us create better matches',
      icon: Users,
      component: DemographicsStep
    },
    {
      title: 'Your workplace',
      subtitle: 'Connect with colleagues safely',
      icon: Briefcase,
      component: CompanyStep
    },
    {
      title: 'Your communities',
      subtitle: 'Find your support network',
      icon: Heart,
      component: AffinityStep
    }
  ];

  // Log component initialization
  React.useEffect(() => {
    log('OnboardingFlow', 'Component initialized', { 
      totalSteps: steps.length, 
      currentStep, 
      formData 
    });
  }, []);

  // Log step changes
  React.useEffect(() => {
    log('OnboardingFlow', 'Step changed', { 
      currentStep, 
      stepTitle: steps[currentStep]?.title,
      progress: `${currentStep + 1}/${steps.length}` 
    });
  }, [currentStep]);

  // Log form data changes
  React.useEffect(() => {
    log('OnboardingFlow', 'Form data updated', formData);
  }, [formData]);

  const handleNext = () => {
    log('handleNext', 'Function called', { 
      currentStep, 
      isLastStep: currentStep === steps.length - 1,
      formData 
    });
    
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      log('handleNext', 'Moving to next step', { from: currentStep, to: newStep });
      setCurrentStep(newStep);
    } else {
      log('handleNext', 'Completing onboarding', formData);
      completeOnboarding(formData);
      log('handleNext', 'Onboarding completed successfully');
    }
  };

  const handleBack = () => {
    log('handleBack', 'Function called', { currentStep });
    
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      log('handleBack', 'Moving to previous step', { from: currentStep, to: newStep });
      setCurrentStep(newStep);
    } else {
      log('handleBack', 'Already at first step, cannot go back');
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    log('updateFormData', 'Function called', { updates, currentFormData: formData });
    const previousData = { ...formData };
    setFormData(prev => ({ ...prev, ...updates }));
    log('updateFormData', 'Form data updated', { 
      previousData, 
      updates, 
      newData: { ...formData, ...updates } 
    });
  };

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="pt-8 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg border border-white/20">
                <Users className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent tracking-tight">Affinity Echo</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-full shadow-sm border border-gray-200">
              <span className="text-sm font-bold text-purple-600">{currentStep + 1}</span>
              <span className="text-xs text-gray-400 font-medium">of</span>
              <span className="text-sm font-bold text-gray-600">{steps.length}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 h-4 rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Step Content */}
      <div className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-8 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 shadow-xl border border-purple-200/50 group`}>
              <currentStepData.icon className="w-12 h-12 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">{currentStepData.title}</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto font-medium leading-relaxed">{currentStepData.subtitle}</p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-blue-50/30 rounded-3xl"></div>
            <div className="relative z-10">
            <StepComponent 
              data={formData} 
              updateData={updateFormData}
              onNext={handleNext}
            />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-10 mb-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 transition-all rounded-2xl hover:bg-white/80 backdrop-blur-sm font-semibold border border-gray-200 hover:border-gray-300 hover:shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl font-bold hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 active:scale-[0.98] transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
            >
              <span>{currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue Journey'}</span>
              {currentStep < steps.length - 1 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}