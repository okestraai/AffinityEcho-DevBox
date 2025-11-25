// src/components/onboarding/OnboardingFlow.tsx
import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Users,
  Briefcase,
  Heart,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { DemographicsStep } from "./DemographicsStep";
import { CompanyStep } from "./CompanyStep";
import { AffinityStep } from "./AffinityStep";
import { CreateOnboardingProfile } from "../../../api/authApis";
import { showToast } from "../../Helper/ShowToast";

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    race: "",
    gender: "",
    careerLevel: "",
    company: "",
    affinityTags: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeOnboarding } = useAuth();

  const steps = [
    {
      title: "Tell us about yourself",
      subtitle: "This helps us create better matches",
      icon: Users,
      component: DemographicsStep,
    },
    {
      title: "Your workplace",
      subtitle: "Connect with colleagues safely",
      icon: Briefcase,
      component: CompanyStep,
    },
    {
      title: "Your communities",
      subtitle: "Find your support network",
      icon: Heart,
      component: AffinityStep,
    },
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...(formData.race && { race: formData.race }),
        ...(formData.gender && { gender: formData.gender }),
        ...(formData.careerLevel && { careerLevel: formData.careerLevel }),
        ...(formData.company && { company: formData.company }),
        ...(formData.affinityTags.length > 0 && {
          affinityTags: formData.affinityTags,
        }),
      };

      await CreateOnboardingProfile(payload);
      await completeOnboarding(); // This refreshes user + redirects + shows toast
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Failed to save your profile. Please try again.";
      showToast("Oops!", message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header & Progress */}
      <header className="pt-8 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg border border-white/20">
                <Users className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
                Affinity Echo
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-full shadow-sm border border-gray-200">
              <span className="text-sm font-bold text-purple-600">
                {currentStep + 1}
              </span>
              <span className="text-xs text-gray-400 font-medium">of</span>
              <span className="text-sm font-bold text-gray-600">
                {steps.length}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 h-4 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-8 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 shadow-xl border border-purple-200/50">
              <currentStepData.icon className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {currentStepData.title}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mx-auto mb-4" />
            <p className="text-lg md:text-xl text-gray-600 max-w-lg mx-auto font-medium">
              {currentStepData.subtitle}
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/30">
            <StepComponent data={formData} updateData={updateFormData} />
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-10">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 disabled:opacity-50 hover:text-gray-900 transition-all rounded-2xl hover:bg-white/80 font-semibold border border-gray-200 hover:border-gray-300"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-bold transition-all duration-200 shadow-xl
                ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 hover:shadow-2xl active:scale-98"
                }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving your info...
                </>
              ) : (
                <>
                  {isLastStep ? "Complete Setup" : "Continue Journey"}
                  {!isLastStep && <ChevronRight className="w-5 h-5" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
