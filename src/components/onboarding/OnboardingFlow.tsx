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
import { CreateOnboardingProfile } from "../../../api/authApis"; // REMOVED CreateFoundationForums
import { formatCompanyName } from "../../utils/CompanyFormatter";
import { showToast } from "../../Helper/ShowToast";

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    race: "",
    gender: "",
    careerLevel: "",
    company: "",
    companyType: "", // Added companyType field
    isCustomCompany: false,
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
    // For all steps except the last one, just proceed
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // If we're on the last step, handle the complete submission
    await handleCompleteOnboarding();
  };

  const handleCompleteOnboarding = async () => {
    setIsSubmitting(true);
    try {
      let finalCompanyName = formData.company;
      let finalCompanyType = formData.companyType || "static"; // Default to static if not set

      // Format company name if it's a custom company
      if (formData.isCustomCompany && formData.company?.trim()) {
        finalCompanyName = formatCompanyName(formData.company.trim());
        finalCompanyType = "other"; // Force to 'other' for custom companies
        console.log("Custom company selected:", {
          original: formData.company,
          formatted: finalCompanyName,
          companyType: finalCompanyType,
        });
      } else {
        console.log("Static company selected:", {
          company: finalCompanyName,
          companyType: finalCompanyType,
        });
      }

   
      const payload = {
        ...(formData.firstName && { firstName: formData.firstName }),
        ...(formData.lastName && { lastName: formData.lastName }),
        ...(formData.race && { race: formData.race }),
        ...(formData.gender && { gender: formData.gender }),
        ...(formData.careerLevel && { careerLevel: formData.careerLevel }),
        ...(finalCompanyName && { company: finalCompanyName }),
        ...(finalCompanyType && { companyType: finalCompanyType }),
        ...(formData.affinityTags.length > 0 && {
          affinityTags: formData.affinityTags,
        }),
      };

      console.log("Submitting onboarding payload:", payload);

      await CreateOnboardingProfile(payload);
      await completeOnboarding(); // This refreshes user + redirects + shows toast
    } catch (error: any) {
      console.error("Error during onboarding completion:", error);
      const message =
        error?.response?.data?.message ||
        "Failed to complete setup. Please try again.";
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

  // Determine button disabled states
  const getNextButtonDisabled = () => {
    if (isSubmitting) return true;

    // For company step, disable if custom company but no company name
    if (
      currentStep === 1 &&
      formData.isCustomCompany &&
      !formData.company?.trim()
    ) {
      return true;
    }

    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header & Progress */}
      <header className="pt-4 pb-4 sm:pt-6 sm:pb-6 md:pt-8 md:pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <img
                src="/affinity-echo-logo-hd.png"
                alt="Affinity Echo Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain"
              />
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent tracking-tight">
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
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 md:h-4 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 h-2 sm:h-3 md:h-4 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 md:mb-8 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 shadow-xl border border-purple-200/50">
              <currentStepData.icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              {currentStepData.title}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mx-auto mb-4" />
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-lg mx-auto font-medium">
              {currentStepData.subtitle}
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-10 border border-white/30">
            <StepComponent
              data={formData}
              updateData={updateFormData}
              onNext={handleNext}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 sm:mt-8 md:mt-10 gap-3">
            <button
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 text-gray-600 disabled:opacity-50 hover:text-gray-900 transition-all rounded-xl sm:rounded-2xl hover:bg-white/80 font-semibold border border-gray-200 hover:border-gray-300 min-h-[48px] text-sm sm:text-base"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={getNextButtonDisabled()}
              className={`flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 rounded-xl sm:rounded-2xl font-bold transition-all duration-200 shadow-xl min-h-[48px] text-sm sm:text-base
                ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 hover:shadow-2xl active:scale-98"
                }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Completing Setup...
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
