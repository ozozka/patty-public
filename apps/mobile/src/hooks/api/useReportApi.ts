import type { CreateReportRequest } from '@patty/contracts';
import { useApiMutation } from 'src/hooks/api/useApiMutation';
import { ModerationService } from 'src/service/ModerationService';

export function useCreateReport() {
  return useApiMutation({
    mutationFn: (req: CreateReportRequest) =>
      ModerationService.createReport(req),
  });
}
