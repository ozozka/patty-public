import { z } from 'zod';

export const locationLevelSchema = z.enum(['province', 'district']);

export const locationSchema = z.object({
  id: z.number().int(),
  parent_id: z.number().int().nullable(),
  name_tr: z.string(),
  name_en: z.string(),
  level: locationLevelSchema,
});

export const speciesSchema = z.object({
  id: z.number().int(),
  name_en: z.string(),
  name_tr: z.string(),
});

export const breedSchema = z.object({
  id: z.number().int(),
  species_id: z.number().int(),
  name_en: z.string(),
  name_tr: z.string(),
});

export const speciesWithBreedsSchema = z.object({
  id: z.number().int(),
  name_en: z.string(),
  name_tr: z.string(),
  breeds: z.array(breedSchema),
});

export const resolveLocationParamsSchema = z.object({
  latitude: z.union([z.number(), z.string()]),
  longitude: z.union([z.number(), z.string()]),
});
