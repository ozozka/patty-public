/**
 * Reusable hook for image selection functionality.
 */
import * as Haptics from 'expo-haptics';
import {
  launchCameraAsync,
  launchImageLibraryAsync,
  MediaTypeOptions,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Config } from 'src/Config';
import { logger } from 'src/utils/logger';

export interface ImagePickerOptions {
  /** Aspect ratio for image cropping [width, height] */
  aspect?: [number, number];
  /** Image quality (0.0 - 1.0) */
  quality?: number;
  /** Whether to allow editing/cropping (only works for single selection) */
  allowsEditing?: boolean;
  /** Whether to allow multiple selection (disables allowsEditing) */
  allowsMultipleSelection?: boolean;
  /** Maximum number of images to select (when multiple selection enabled) */
  selectionLimit?: number;
  /** Media types to allow */
  mediaTypes?: MediaTypeOptions;
  /** Initial URI to set (for edit scenarios) */
  initialUri?: string | null;
}

export interface ImagePickerResult {
  /** Selected image URI, null if canceled (legacy single result) */
  uri: string | null;
  /** Array of selected image URIs */
  uris: string[];
  /** Whether the picker was canceled */
  canceled: boolean;
}

export interface UseImagePickerReturn {
  /** Selected image URI, null if no image selected (legacy) */
  imageUri: string | null;
  /** Function to launch image library and return result */
  pickImage: (
    overrideOptions?: Partial<ImagePickerOptions>,
  ) => Promise<ImagePickerResult>;
  /** Function to launch camera and return result */
  takePhoto: () => Promise<ImagePickerResult>;
  /** Function to clear selected image */
  clearImage: () => void;
  /** Whether the hook is currently requesting permissions */
  isRequestingPermission: boolean;
}

/**
 * Hook for selecting images from device library or camera.
 *
 * @param options - Configuration options for image picker
 * @returns Object containing image URI and control functions
 */
export function useImagePicker(
  options: ImagePickerOptions = {},
): UseImagePickerReturn {
  const {
    aspect = [
      Config.image.defaultAspectRatio[0],
      Config.image.defaultAspectRatio[1],
    ] satisfies [number, number],
    quality = Config.image.defaultQuality,
    allowsEditing = true,
    allowsMultipleSelection = false,
    selectionLimit = 0,
    initialUri = null,
  } = options;

  const [imageUri, setImageUri] = useState<string | null>(initialUri);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Sync with initialUri if it changes externally
  useEffect(() => {
    if (initialUri !== undefined) {
      setImageUri(initialUri);
    }
  }, [initialUri]);

  const requestLibraryPermission = async (): Promise<boolean> => {
    setIsRequestingPermission(true);
    try {
      logger.info('Requesting media library permissions...');
      const { status } = await requestMediaLibraryPermissionsAsync();
      logger.info(`Media library permission status: ${status}`);
      if (status !== 'granted') {
        logger.warn('Photo library permission denied');
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error requesting media library permission', { error });
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    setIsRequestingPermission(true);
    try {
      logger.info('Requesting camera permissions...');
      const { status } = await requestCameraPermissionsAsync();
      logger.info(`Camera permission status: ${status}`);
      if (status !== 'granted') {
        logger.warn('Camera permission denied');
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Error requesting camera permission', { error });
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const pickImage = useCallback(
    async (
      overrideOptions?: Partial<ImagePickerOptions>,
    ): Promise<ImagePickerResult> => {
      logger.info('pickImage called');
      const hasPermission = await requestLibraryPermission();
      if (!hasPermission) {
        logger.warn('pickImage aborted due to missing permission');
        return { uri: null, uris: [], canceled: true };
      }

      try {
        const currentOptions = { ...options, ...overrideOptions };
        const multiple =
          overrideOptions?.allowsMultipleSelection ?? allowsMultipleSelection;

        logger.info('Launching image library...', { multiple, currentOptions });
        const result = await launchImageLibraryAsync({
          mediaTypes: MediaTypeOptions.Images,
          allowsEditing: multiple
            ? false
            : (currentOptions.allowsEditing ?? allowsEditing),
          allowsMultipleSelection: multiple,
          selectionLimit: multiple
            ? (currentOptions.selectionLimit ?? selectionLimit)
            : 1,
          aspect: multiple ? undefined : (currentOptions.aspect ?? aspect),
          quality: currentOptions.quality ?? quality,
        });

        logger.info('Image library result received', {
          canceled: result.canceled,
          assetsCount: result.assets?.length,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          const uris = result.assets.map((asset) => asset.uri);
          const firstUri = uris[0] ?? null;
          setImageUri(firstUri);
          return { uri: firstUri, uris, canceled: false };
        }

        return { uri: null, uris: [], canceled: true };
      } catch (error) {
        logger.error('Failed to pick image', { error });
        return { uri: null, uris: [], canceled: true };
      }
    },
    [
      options,
      allowsMultipleSelection,
      allowsEditing,
      selectionLimit,
      aspect,
      quality,
    ],
  );

  const takePhoto = useCallback(async (): Promise<ImagePickerResult> => {
    logger.info('takePhoto called');
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      logger.warn('takePhoto aborted due to missing permission');
      return { uri: null, uris: [], canceled: true };
    }

    try {
      logger.info('Launching camera...');
      const result = await launchCameraAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: allowsEditing,
        aspect: allowsEditing ? aspect : undefined,
        quality,
      });

      logger.info('Camera result received', {
        canceled: result.canceled,
        assetsCount: result.assets?.length,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const uris = result.assets.map((asset) => asset.uri);
        const firstUri = uris[0] ?? null;
        setImageUri(firstUri);
        return { uri: firstUri, uris, canceled: false };
      }

      return { uri: null, uris: [], canceled: true };
    } catch (error) {
      logger.error('Failed to take photo', { error });
      return { uri: null, uris: [], canceled: true };
    }
  }, [allowsEditing, aspect, quality]);

  const clearImage = useCallback(() => {
    setImageUri(null);
  }, []);

  return {
    imageUri,
    pickImage,
    takePhoto,
    clearImage,
    isRequestingPermission,
  };
}
