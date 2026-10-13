import { http, HttpResponse } from 'msw';
import { Config } from 'src/Config';

const BASE_URL = Config.api.BASE_URL.replace(/\/$/, '');

const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const MOCK_PET_ID = '550e8400-e29b-41d4-a716-446655440001';

const MOCK_PROFILE = {
  id: MOCK_USER_ID,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  status: 'verified',
  language: 'en',
  theme: 'light',
  home_location_id: 1,
  location_precision: 'exact',
  phone_verified: true,
  share_phone_with_matches: true,
  is_online: true,
  created_at: new Date().toISOString(),
  pets: [
    {
      id: MOCK_PET_ID,
      account_id: MOCK_USER_ID,
      name: 'My Pet',
      breed_id: 1,
      gender: 'male',
      matching_preferences: ['female'],
      image_url: null,
      photos: [],
      metadata: {},
      created_at: new Date().toISOString(),
    },
  ],
  friends_count: 0,
  activity_status: 'Online',
};

export const handlers = [
  // Locations
  http.get(`${BASE_URL}/locations`, () => {
    return HttpResponse.json([
      {
        id: 1,
        name_tr: 'Adana',
        name_en: 'Adana',
        level: 'province',
        parent_id: null,
      },
      {
        id: 34,
        name_tr: 'İstanbul',
        name_en: 'Istanbul',
        level: 'province',
        parent_id: null,
      },
    ]);
  }),

  // Auth / Profile
  http.get(`${BASE_URL}/profile`, () => {
    return HttpResponse.json(MOCK_PROFILE);
  }),

  // Login
  http.post(`${BASE_URL}/login`, async () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      refresh_token: 'mock-refresh-token',
      status: 'verified',
      user: MOCK_PROFILE,
    });
  }),

  // Register
  http.post(`${BASE_URL}/register`, () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      refresh_token: 'mock-refresh-token',
      status: 'verified',
    });
  }),

  // Candidates
  http.get(`${BASE_URL}/matching/candidates`, () => {
    return HttpResponse.json([
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        account_id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Candidate Pet',
        breed_id: 1,
        breed_name: 'Golden Retriever',
        location_name: 'Istanbul',
        distance_m: 1200,
        birth_date: null,
        bio: 'Friendly candidate',
        photos: ['https://example.com/pet2.jpg'],
        gender: 'female',
        energy_level: 3,
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Swipe
  http.post(`${BASE_URL}/matching/swipe`, () => {
    return HttpResponse.json({
      status: 'NO_MATCH',
    });
  }),

  // Update profile (PATCH /user)
  http.patch(`${BASE_URL}/user`, () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Health
  http.get(`${BASE_URL}/health`, () => {
    return HttpResponse.json('OK');
  }),

  // Validate
  http.get(`${BASE_URL}/auth/validate`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth === 'Bearer valid-token') {
      return HttpResponse.json({ status: 'valid' });
    }
    return HttpResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid token' },
      { status: 401 },
    );
  }),
];
