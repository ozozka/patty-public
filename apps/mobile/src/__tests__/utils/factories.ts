import type {
  Match,
  Message,
  Pet,
  PetCandidate,
  PetPhoto,
  ProfileResponse,
  PublicProfileResponse,
  SpeciesWithBreeds,
} from '@patty/contracts';

let idCounter = 0;
// Note: We use valid-looking UUIDs for tests to satisfy Zod validation
const nextId = () => {
  idCounter += 1;
  return `550e8400-e29b-41d4-a716-${idCounter.toString().padStart(12, '0')}`;
};

export const resetFactories = () => {
  idCounter = 0;
};

export const factories = {
  account: {
    build: (overrides: Partial<ProfileResponse> = {}): ProfileResponse => ({
      id: nextId(),
      username: 'johndoe',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      bio: 'Pet lover',
      profile_picture_url: 'https://example.com/photo.jpg',
      status: 'verified',
      phone_verified: true,
      share_phone_with_matches: true,
      is_online: false,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      metadata: {},
      location_precision: 'exact',
      language: 'en',
      theme: 'light',
      pets: [],
      ...overrides,
    }),
  },

  publicProfile: {
    build: (
      overrides: Partial<PublicProfileResponse> = {},
    ): PublicProfileResponse => ({
      id: nextId(),
      username: 'johndoe',
      first_name: 'John',
      last_name: 'Doe',
      bio: 'Pet lover',
      profile_picture_url: 'https://example.com/photo.jpg',
      phone_verified: true,
      home_location_id: 1,
      distance_m: 1000,
      pets: [],
      created_at: new Date().toISOString(),
      ...overrides,
    }),
  },

  pet: {
    build: (overrides: Partial<Pet> = {}): Pet => ({
      id: nextId(),
      account_id: nextId(),
      name: 'Rex',
      breed_id: 1,
      gender: 'male',
      bio: 'Friendly dog',
      birth_date: '2020-01-01',
      energy_level: 3,
      photos: [],
      matching_preferences: ['female'],
      created_at: new Date().toISOString(),
      metadata: {},
      ...overrides,
    }),
  },

  petCandidate: {
    build: (overrides: Partial<PetCandidate> = {}): PetCandidate => ({
      id: nextId(),
      account_id: nextId(),
      name: 'Luna',
      breed_id: 2,
      breed_name: 'Siberian Husky',
      gender: 'female',
      bio: 'Energetic husky',
      birth_date: '2021-05-15',
      energy_level: 5,
      photos: ['https://example.com/husky.jpg'],
      location_name: 'Istanbul',
      distance_m: 5000,
      created_at: new Date().toISOString(),
      ...overrides,
    }),
  },

  match: {
    build: (overrides: Partial<Match> = {}): Match => ({
      id: nextId(),
      created_at: new Date().toISOString(),
      other_user: {
        id: nextId(),
        username: 'alice',
        email: 'alice@example.com',
        first_name: 'Alice',
        last_name: 'Smith',
        bio: null,
        home_location_id: 1,
        latitude: 41.0082,
        longitude: 28.9784,
        language: 'tr',
        theme: 'system',
        profile_picture_url: null,
        phone_number: null,
        phone_verified: true,
        share_phone_with_matches: false,
        is_online: false,
        last_seen_at: null,
        status: 'verified',
        location_precision: 'city',
        created_at: new Date().toISOString(),
      },
      unread_count: 0,
      is_online: false,
      last_message: null,
      ...overrides,
    }),
  },

  message: {
    build: (overrides: Partial<Message> = {}): Message => ({
      id: nextId(),
      match_id: nextId(),
      sender_id: nextId(),
      content: 'Hello there!',
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString(),
      ...overrides,
    }),
  },

  species: {
    build: (overrides: Partial<SpeciesWithBreeds> = {}): SpeciesWithBreeds => ({
      id: 1,
      name_en: 'Dog',
      name_tr: 'Köpek',
      breeds: [
        {
          id: 1,
          species_id: 1,
          name_en: 'Golden Retriever',
          name_tr: 'Golden',
        },
      ],
      ...overrides,
    }),
  },

  petPhoto: {
    build: (overrides: Partial<PetPhoto> = {}): PetPhoto => ({
      id: nextId(),
      pet_id: nextId(),
      image_url: 'https://example.com/photo.jpg',
      display_order: 0,
      created_at: new Date().toISOString(),
      ...overrides,
    }),
  },
};
