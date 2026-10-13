import type { ProfileResponse, PublicProfileResponse } from '@patty/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type ProfileCompletionAction =
  | 'photo'
  | 'pet'
  | 'edit_profile'
  | 'phone';

export interface ProfileCompletionStep {
  id: string;
  label: string;
  isCompleted: boolean;
  weight: number;
  action: ProfileCompletionAction;
}

export interface UseProfileCompletionResult {
  percentage: number;
  steps: ProfileCompletionStep[];
  incompleteSteps: ProfileCompletionStep[];
  hasIncompleteSteps: boolean;
}

/**
 * Hook to calculate profile completion percentage and identify missing steps.
 *
 * Weighting:
 * - First Name: 10%
 * - Last Name: 10%
 * - Bio: 10%
 * - Profile Photo: 20%
 * - Home Location: 15%
 * - Phone Number: 15%
 * - At least one pet: 20%
 */
export function useProfileCompletion(
  profile: ProfileResponse | PublicProfileResponse | null | undefined,
): UseProfileCompletionResult {
  const { t } = useTranslation();

  const steps = useMemo((): ProfileCompletionStep[] => {
    if (!profile || !profile.username) return [];

    return [
      {
        id: 'first_name',
        label: t('profile.completion_step_first_name'),
        isCompleted: !!profile.first_name,
        weight: 10,
        action: 'edit_profile',
      },
      {
        id: 'last_name',
        label: t('profile.completion_step_last_name'),
        isCompleted: !!profile.last_name,
        weight: 10,
        action: 'edit_profile',
      },
      {
        id: 'profile_picture',
        label: t('profile.completion_step_photo'),
        isCompleted: !!profile.profile_picture_url,
        weight: 20,
        action: 'photo',
      },
      {
        id: 'bio',
        label: t('profile.completion_step_bio'),
        isCompleted: !!profile.bio,
        weight: 10,
        action: 'edit_profile',
      },
      {
        id: 'home_location',
        label: t('profile.completion_step_location'),
        isCompleted: !!profile.home_location_id,
        weight: 15,
        action: 'edit_profile',
      },
      {
        id: 'phone_number',
        label: t('profile.completion_step_phone'),
        isCompleted: !!profile.phone_number,
        weight: 15,
        action: 'phone',
      },
      {
        id: 'pets',
        label: t('profile.completion_step_pet'),
        isCompleted: (profile.pets?.length ?? 0) > 0,
        weight: 20,
        action: 'pet',
      },
    ];
  }, [profile, t]);

  const { percentage, incompleteSteps } = useMemo(() => {
    if (steps.length === 0) return { percentage: 0, incompleteSteps: [] };

    const totalWeight = steps.reduce((acc, step) => acc + step.weight, 0);
    const completedWeight = steps.reduce(
      (acc, step) => acc + (step.isCompleted ? step.weight : 0),
      0,
    );

    const calcPercentage = Math.round((completedWeight / totalWeight) * 100);
    const missingSteps = steps.filter((step) => !step.isCompleted);

    return {
      percentage: Math.min(calcPercentage, 100),
      incompleteSteps: missingSteps,
    };
  }, [steps]);

  return {
    percentage,
    steps,
    incompleteSteps,
    hasIncompleteSteps: incompleteSteps.length > 0,
  };
}
