import { z } from 'zod';

export const petGenderSchema = z.enum(['male', 'female']);

export const petPhotoSchema = z.object({
  id: z.string().uuid(),
  pet_id: z.string().uuid(),
  image_url: z.string().url(),
  display_order: z.number().int(),
  created_at: z.string(),
});

export const petSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  name: z.string(),
  breed_id: z.number().int(),
  bio: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  energy_level: z.number().int().nullable().optional(),
  gender: petGenderSchema.nullable().optional(),
  matching_preferences: z.array(petGenderSchema),
  photos: z.array(petPhotoSchema).optional(),
  metadata: z.record(z.string(), z.unknown()),
  deleted_at: z.string().nullable().optional(),
  created_at: z.string(),
});

export const petRequestSchema = z.object({
  name: z.string().min(1).max(256),
  breed_id: z.number().int(),
  gender: petGenderSchema,
  matching_preferences: z.array(petGenderSchema),
  bio: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  energy_level: z.number().int().min(1).max(5).nullable().optional(),
  id: z.string().uuid().optional(),
});

export const petCandidateSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  name: z.string(),
  breed_id: z.number().int(),
  breed_name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  energy_level: z.number().int().nullable().optional(),
  gender: petGenderSchema.nullable().optional(),
  // Candidate photos are returned as an array of URLs (not full PetPhoto objects).
  photos: z.array(z.string()),
  distance_m: z.number().nullable().optional(),
  location_name: z.string().nullable().optional(),
  created_at: z.union([z.string(), z.date()]),
});

export const addPetPhotoRequestSchema = z.object({
  image_url: z.string().url(),
});

export const reorderPetPhotosRequestSchema = z.object({
  ordered_photo_ids: z.array(z.string().uuid()),
});
