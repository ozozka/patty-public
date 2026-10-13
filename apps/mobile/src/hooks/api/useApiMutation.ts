import type { QueryKey, UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ParseKeys } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useToast } from 'src/hooks/ui/useToast';

export interface ApiMutationOptions<
  TData,
  TError,
  TVariables,
  TContext,
> extends Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'onSuccess'
> {
  invalidateQueries?: QueryKey[];
  successMessage?: ParseKeys;
  showSuccessAlert?: boolean;
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext,
  ) => Promise<unknown> | unknown;
}

/**
 * A wrapper around useMutation that adds common side effects like
 * query invalidation and success notifications.
 */
export function useApiMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(options: ApiMutationOptions<TData, TError, TVariables, TContext>) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const toast = useToast();

  const {
    invalidateQueries,
    successMessage,
    showSuccessAlert,
    onSuccess,
    ...mutationOptions
  } = options;

  return useMutation({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      // 1. Handle query invalidation
      if (invalidateQueries) {
        invalidateQueries.forEach((queryKey) => {
          void queryClient.invalidateQueries({ queryKey });
        });
      }

      // 2. Show success message if requested
      if ((showSuccessAlert || successMessage) && successMessage) {
        toast.success(t(successMessage));
      }

      // 3. Call original onSuccess
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
  });
}
