import type { BlockUserRequest, CreateReportRequest } from '@patty/contracts';
import {
  blockedUserSchema,
  createReportResponseSchema,
} from '@patty/contracts';
import { apiClient } from 'src/api/client';
import { z } from 'zod';

import { BaseService } from './BaseService';

export class ModerationService extends BaseService {
  static async blockUser(req: BlockUserRequest): Promise<void> {
    const response = await apiClient.api.v1.users[':user_id'].block.$post({
      param: { user_id: req.blocked_id },
    });
    return this.handle(response);
  }

  static async unblockUser(userId: string): Promise<void> {
    const response = await apiClient.api.v1.users[':user_id'].block.$delete({
      param: { user_id: userId },
    });
    return this.handle(response);
  }

  static async getBlockedUsers(): Promise<z.infer<typeof blockedUserSchema>[]> {
    const response = await apiClient.api.v1.users.blocked.$get();
    return this.handle(response, z.array(blockedUserSchema));
  }

  static async createReport(req: CreateReportRequest): Promise<string> {
    const response = await apiClient.api.v1.reports.$post({ json: req });
    const result = await this.handle(response, createReportResponseSchema);
    return result.id;
  }
}
