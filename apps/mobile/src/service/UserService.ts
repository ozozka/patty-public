/** Service for user-related API calls. */
import type {
  ChangePasswordRequest,
  ProfileResponse,
  PublicProfileResponse,
  UpdateUserRequest,
} from '@patty/contracts';
import {
  profileResponseSchema,
  publicProfileResponseSchema,
} from '@patty/contracts';
import { apiClient } from 'src/api/client';

import { BaseService } from './BaseService';

export class UserService extends BaseService {
  /**
   * Get current user's profile.
   */
  static async getProfile(): Promise<ProfileResponse> {
    const response = await apiClient.api.v1.profile.$get();
    return this.handle(response, profileResponseSchema);
  }

  /**
   * Get a public user profile.
   */
  static async getPublicProfile(id: string): Promise<PublicProfileResponse> {
    const response = await apiClient.api.v1.users[':id'].$get({
      param: { id },
    });
    return this.handle(response, publicProfileResponseSchema);
  }

  /**
   * Update current user's data.
   */
  static async updateProfile(data: UpdateUserRequest): Promise<void> {
    const response = await apiClient.api.v1.user.$patch({ json: data });
    return this.handle(response);
  }

  /**
   * Update user location coordinates.
   */
  static async updateLocation(
    latitude: number,
    longitude: number,
  ): Promise<void> {
    const response = await apiClient.api.v1.profile.location.$patch({
      json: { latitude, longitude },
    });
    return this.handle(response);
  }

  /**
   * Change user password.
   */
  static async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await apiClient.api.v1.user.password.$post({
      json: data,
    });
    return this.handle(response);
  }
}
