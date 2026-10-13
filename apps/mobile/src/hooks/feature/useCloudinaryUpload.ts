import { useState } from 'react';
import { MediaService } from 'src/service/MediaService';
import { logger } from 'src/utils/logger';

/**
 * Hook to handle signed uploads to Cloudinary.
 * Orchestrates fetching a signature from our API and then
 * uploading directly to Cloudinary.
 */
export function useCloudinaryUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Upload an image to Cloudinary.
   * @param uri Local file URI
   * @param type 'pet' | 'profile' | 'chat'
   * @param id The entity ID (pet ID, user ID, or match ID)
   */
  const uploadImage = async (
    uri: string,
    type: 'pet' | 'profile' | 'chat',
    id: string,
  ): Promise<string> => {
    setIsUploading(true);
    setError(null);

    try {
      // 1. Get a signature from our backend
      const sigRes = await MediaService.getSignature({
        image_type: type,
        entity_id: id,
      });

      // 2. Upload directly to Cloudinary using the signature
      const secureUrl = await MediaService.uploadToCloudinary(uri, sigRes);

      setIsUploading(false);
      return secureUrl;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Upload failed');
      logger.error('Cloudinary upload failed', { error: err });
      setError(err);
      setIsUploading(false);
      throw err;
    }
  };

  return {
    uploadImage,
    isUploading,
    error,
  };
}
