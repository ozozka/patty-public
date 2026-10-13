/** Service for matching and discovery API calls. */
import type {
  CandidatesResponse,
  GetCandidatesParams,
  Match,
  SwipeRequest,
  SwipeResult,
} from '@patty/contracts';
import {
  candidatesResponseSchema,
  matchSchema,
  swipeResultSchema,
} from '@patty/contracts';
import { apiClient } from 'src/api/client';
import { z } from 'zod';

import { BaseService } from './BaseService';

export class MatchingService extends BaseService {
  /**
   * Get discovery candidates for a pet.
   */
  static async getCandidates(
    params: GetCandidatesParams,
  ): Promise<CandidatesResponse> {
    const response = await apiClient.api.v1.matching.candidates.$get({
      query: {
        active_pet_id: params.active_pet_id,
        radius_km: params.radius_km,
        limit: params.limit,
      },
    });
    return this.handle(response, candidatesResponseSchema);
  }

  /**
   * Record a swipe (like/dislike).
   */
  static async swipe(payload: SwipeRequest): Promise<SwipeResult> {
    const response = await apiClient.api.v1.matching.swipe.$post({
      json: payload,
    });
    return this.handle(response, swipeResultSchema);
  }

  /**
   * Get all active matches.
   */
  static async getMatches(): Promise<Match[]> {
    const response = await apiClient.api.v1.matches.$get();
    return this.handle(response, z.array(matchSchema));
  }

  /**
   * Unmatch with a user.
   */
  static async unmatch(matchId: string): Promise<void> {
    const response = await apiClient.api.v1.matches[':match_id'].$delete({
      param: { match_id: matchId },
    });
    return this.handle(response);
  }
}
