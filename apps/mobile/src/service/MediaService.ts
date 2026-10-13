/** Service for media-related API calls (Cloudinary) and uploads. */
import type { CloudinarySignature, SignatureRequest } from '@patty/contracts';
import { cloudinarySignatureSchema } from '@patty/contracts';
import { apiClient } from 'src/api/client';

import { BaseService } from './BaseService';

/**
 * React Native-specific file object for FormData.
 * In React Native, FormData expects a polyfill-like object with uri, type, and name.
 */
interface ReactNativeFileObject {
  uri: string;
  type: string;
  name: string;
}

// React Native's FormData polyfill accepts objects with uri/type/name for file uploads
// at runtime, even though the web FormData types only declare string | Blob.
declare global {
  interface FormData {
    append(name: string, value: ReactNativeFileObject, fileName?: string): void;
  }
}

export class MediaService extends BaseService {
  /**
   * Get a Cloudinary upload signature.
   */
  static async getSignature(
    params: SignatureRequest,
  ): Promise<CloudinarySignature> {
    const response = await apiClient.api.v1.cloudinary.signature.$get({
      query: params,
    });
    return this.handle(response, cloudinarySignatureSchema);
  }

  /**
   * Upload an image directly to Cloudinary using a signed request.
   */
  static async uploadToCloudinary(
    uri: string,
    signatureData: CloudinarySignature,
  ): Promise<string> {
    const formData = new FormData();

    // React Native requires a specific object format for file uploads in FormData
    const file: ReactNativeFileObject = {
      uri,
      type: 'image/jpeg',
      name: 'upload.jpg',
    };

    // React Native's FormData polyfill accepts this object at runtime.
    // The declare global above adds the overload so TypeScript accepts it.
    formData.append('file', file);
    formData.append('api_key', signatureData.api_key);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);
    formData.append('public_id', signatureData.public_id);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signatureData.cloud_name}/image/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );

    // Manual handling for external fetch call
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Cloudinary upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  }
}
