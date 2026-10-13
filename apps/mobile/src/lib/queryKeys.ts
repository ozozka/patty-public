/**
 * Single source of truth for all React Query cache keys.
 * Using functions ensures keys are comparable by value and TypeScript catches renames.
 */
export const QueryKeys = {
  profile: () => ['profile'] as const,
  locations: () => ['locations'] as const,
  cities: () => ['cities'] as const,
  petTypes: () => ['pet-types'] as const,
  species: () => ['species'] as const, // Legacy alias
  conversations: () => ['conversations'] as const,
  candidates: (
    petId: string | null,
    radius?: number | null,
    limit?: number | null,
  ) => ['candidates', petId, radius, limit] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  publicProfile: (userId: string | null) => ['public-profile', userId] as const,
  userProfile: (userId: string) => ['user-profile', userId] as const, // Legacy alias
  matches: () => ['matches'] as const,
  blockedUsers: () => ['blocked-users'] as const,
  deletedPets: () => ['pets', 'deleted'] as const,
};
