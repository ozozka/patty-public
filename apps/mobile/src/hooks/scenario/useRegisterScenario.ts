/** Scenario hook for user registration flow with step-by-step wizard. */
import type {
  Location as LocationType,
  RegisterRequest,
} from '@patty/contracts';
import { useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useRegister } from 'src/hooks/api/useAuthApi';
import { useLocationPicker } from 'src/hooks/feature/useLocationPicker';
import { useToast } from 'src/hooks/ui/useToast';
import { useStepWizard } from 'src/hooks/util/useStepWizard';
import { useAuthStore } from 'src/store/useAuthStore';
import { authRateLimiters } from 'src/utils/rateLimiter';

const TOTAL_STEPS = 4;

export const useRegisterScenario = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const registerMutation = useRegister();
  const authenticate = useAuthStore((state) => state.authenticate);

  const registerLimiter = useRef(authRateLimiters.register());

  const {
    currentStep,
    totalSteps,
    canGoBack,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
  } = useStepWizard({ totalSteps: TOTAL_STEPS });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterRequest>({
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      phone_number: '',
      home_location_id: 0,
    },
    mode: 'onChange',
  });

  const homeLocationId = watch('home_location_id');

  // Location picker — auto-detects GPS and manages selection
  const {
    locations,
    provinces,
    districts,
    selectedProvince,
    selectedDistrict,
    selectProvince,
    selectDistrict,
    clearSelection,
    handleAutoDetect,
    isDetecting,
    isLoading: isLocationLoading,
  } = useLocationPicker({
    initialLocationId: homeLocationId,
    onSelect: (location) => setValue('home_location_id', location.id),
  });

  const handleSelectProvince = useCallback(
    (province: LocationType | null) => {
      setValue('home_location_id', 0); // Clear district ID when province changes
      selectProvince(province);
    },
    [selectProvince, setValue],
  );

  const selectedLocation = selectedDistrict ?? selectedProvince;

  const firstName = watch('first_name');
  const lastName = watch('last_name');
  const email = watch('email');
  const password = watch('password');
  const username = watch('username');
  const phoneNumber = watch('phone_number') ?? '';

  const validateStep = useCallback(
    async (step: number): Promise<boolean> => {
      switch (step) {
        case 0:
          return trigger(['first_name', 'last_name']);
        case 1:
          return trigger(['username', 'email', 'password']);
        case 2:
          return trigger(['home_location_id']);
        case 3:
          return trigger(['phone_number']);
        default:
          return false;
      }
    },
    [trigger],
  );

  const canProceedCurrentStep = useCallback((): boolean => {
    switch (currentStep) {
      case 0:
        return !!firstName?.trim() && !!lastName?.trim();
      case 1: {
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        return (
          !!username?.trim() && emailRegex.test(email) && password.length >= 8
        );
      }
      case 2:
        return !!homeLocationId && homeLocationId > 0;
      case 3: {
        const phoneRegex = /^\+?[1-9]\d{6,14}$/;
        return !!phoneNumber && phoneRegex.test(phoneNumber);
      }
      default:
        return false;
    }
  }, [
    currentStep,
    firstName,
    lastName,
    username,
    email,
    password,
    homeLocationId,
    phoneNumber,
  ]);

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && canProceedCurrentStep()) {
      goNext();
    }
  }, [currentStep, validateStep, canProceedCurrentStep, goNext]);

  const handleRegister = async (data: RegisterRequest) => {
    if (registerMutation.isPending) {
      return;
    }

    if (!registerLimiter.current.canAttempt()) {
      toast.error(t('error.rate_limit.try_again_shortly'));
      return;
    }

    registerMutation.mutate(data, {
      onSuccess: (response) => {
        // Backend returns tokens directly - no separate login needed
        authenticate(response.token, response.refresh_token);
      },
      onError: (error) => {
        const isConflict =
          error !== null &&
          typeof error === 'object' &&
          'error' in error &&
          error.error === 'CONFLICT';
        if (isConflict) {
          toast.error(t('error.auth.username_email_exists'));
        } else {
          const message =
            error !== null &&
            typeof error === 'object' &&
            'message' in error &&
            typeof error.message === 'string'
              ? error.message
              : undefined;
          toast.error(message ?? t('error.generic.internal_error'));
        }
      },
    });
  };

  return {
    control,
    handleRegister: handleSubmit(handleRegister),
    locations,
    isLoading: registerMutation.isPending || isLocationLoading,
    selectedLocation,
    setSelectedLocation: (location: { id: number; name_tr: string }) =>
      setValue('home_location_id', location.id),
    provinces,
    districts,
    selectedProvince,
    selectedDistrict,
    selectProvince: handleSelectProvince,
    selectDistrict,
    clearSelection,
    handleAutoDetect,
    isDetecting,
    phoneNumber,
    setPhoneNumber: (phone: string) => setValue('phone_number', phone),
    currentStep,
    totalSteps,
    canGoBack,
    isFirstStep,
    isLastStep,
    goNext: handleNext,
    goBack,
    canProceed: canProceedCurrentStep(),
    errors,
    firstName,
    lastName,
    email,
    password,
    username,
  };
};
