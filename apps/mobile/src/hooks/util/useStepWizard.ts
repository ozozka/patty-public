/** Hook for managing multi-step wizard state and navigation */
import { useCallback, useMemo, useState } from 'react';

export interface UseStepWizardOptions {
  totalSteps: number;
  initialStep?: number;
}

export interface UseStepWizardReturn {
  currentStep: number;
  totalSteps: number;
  canGoBack: boolean;
  canGoNext: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

export function useStepWizard(
  options: UseStepWizardOptions,
): UseStepWizardReturn {
  const { totalSteps, initialStep = 0 } = options;
  const [currentStep, setCurrentStep] = useState(initialStep);

  const { canGoBack, canGoNext, isFirstStep, isLastStep, progress } = useMemo(
    () => ({
      canGoBack: currentStep > 0,
      canGoNext: currentStep < totalSteps - 1,
      isFirstStep: currentStep === 0,
      isLastStep: currentStep === totalSteps - 1,
      progress: ((currentStep + 1) / totalSteps) * 100,
    }),
    [currentStep, totalSteps],
  );

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      const clampedStep = Math.max(0, Math.min(step, totalSteps - 1));
      setCurrentStep(clampedStep);
    },
    [totalSteps],
  );

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  return {
    currentStep,
    totalSteps,
    canGoBack,
    canGoNext,
    isFirstStep,
    isLastStep,
    progress,
    goNext,
    goBack,
    goToStep,
    reset,
  };
}
