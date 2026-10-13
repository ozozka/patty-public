import { describe, expect, it } from '@jest/globals';
import type { ProfileResponse } from '@patty/contracts';
import { renderHook } from '@testing-library/react-native';

import { useProfileCompletion } from '../useProfileCompletion';

const mockProfile: ProfileResponse = {
  id: 'user-1',
  username: 'johndoe',
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe',
  bio: 'Hello world',
  profile_picture_url: 'https://example.com/photo.jpg',
  home_location_id: 1,
  phone_number: '+905551234567',
  phone_verified: true,
  share_phone_with_matches: false,
  is_online: false,
  location_precision: 'city',
  language: 'tr',
  theme: 'system',
  status: 'verified',
  created_at: new Date().toISOString(),
  pets: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      account_id: 'user-1',
      name: 'Buddy',
      breed_id: 1,
      matching_preferences: [],
      metadata: {},
      created_at: new Date().toISOString(),
    },
  ],
};

describe('useProfileCompletion', () => {
  it('returns 0% when profile is null', () => {
    const { result } = renderHook(() => useProfileCompletion(null));
    expect(result.current.percentage).toBe(0);
    expect(result.current.steps).toEqual([]);
  });

  it('calculates 100% when all fields are filled', () => {
    const { result } = renderHook(() => useProfileCompletion(mockProfile));
    expect(result.current.percentage).toBe(100);
    expect(result.current.incompleteSteps).toHaveLength(0);
  });

  it('calculates partial completion correctly', () => {
    const partialProfile: ProfileResponse = {
      ...mockProfile,
      bio: null,
      profile_picture_url: null,
      pets: [],
    };

    // Weighting:
    // First Name (10) + Last Name (10) + Location (15) + Phone (15) = 50%
    // Bio (10), Photo (20), Pet (20) are missing

    const { result } = renderHook(() => useProfileCompletion(partialProfile));
    expect(result.current.percentage).toBe(50);
    expect(result.current.incompleteSteps).toHaveLength(3);
    expect(result.current.incompleteSteps.map((s) => s.id)).toContain('bio');
    expect(result.current.incompleteSteps.map((s) => s.id)).toContain(
      'profile_picture',
    );
    expect(result.current.incompleteSteps.map((s) => s.id)).toContain('pets');
  });

  it('handles empty strings as incomplete', () => {
    const partialProfile: ProfileResponse = {
      ...mockProfile,
      bio: '',
    };

    const { result } = renderHook(() => useProfileCompletion(partialProfile));
    expect(result.current.percentage).toBe(90);
    expect(result.current.incompleteSteps[0]?.id).toBe('bio');
  });
});
