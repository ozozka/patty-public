import { z } from 'zod';

export const signatureRequestSchema = z.object({
  image_type: z.string().min(1),
  entity_id: z.string().uuid(),
});

export const cloudinarySignatureSchema = z.object({
  signature: z.string(),
  timestamp: z.number().int(),
  api_key: z.string(),
  cloud_name: z.string(),
  public_id: z.string(),
  folder: z.string(),
});
