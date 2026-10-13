import { z } from 'zod';

export const errorCodeSchema = z.enum([
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION',
  'INTERNAL',
  'RATE_LIMITED',
  'GONE',
]);

export const errorResponseSchema = z.object({
  error: errorCodeSchema,
  message: z.string(),
  context: z.string().optional(),
  field_errors: z.record(z.string(), z.array(z.string())).optional(),
});

export const paginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    cursor: z.string().nullable(),
    has_more: z.boolean(),
  });

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const matchIdParamSchema = z.object({
  match_id: z.string().uuid(),
});

export const userIdParamSchema = z.object({
  user_id: z.string().uuid(),
});

export const petIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const photoIdParamSchema = z.object({
  id: z.string().uuid(),
  photo_id: z.string().uuid(),
});
