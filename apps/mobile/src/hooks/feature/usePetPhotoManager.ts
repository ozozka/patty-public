/**
 * Manages pet photo list state, ImagePicker invocation, Cloudinary upload,
 * and reorder/remove operations. Extracted from usePetFormScenario so each
 * concern can be tested in isolation.
 */
import type { PetPhoto } from '@patty/contracts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCloudinaryUpload } from 'src/hooks/feature/useCloudinaryUpload';
import type { ImagePickerOptions } from 'src/hooks/feature/useImagePicker';
import { useImagePicker } from 'src/hooks/feature/useImagePicker';
import { PetService } from 'src/service/PetService';
import { logger } from 'src/utils/logger';
import { uuidv4 } from 'src/utils/uuid';

/** Maximum number of photos per pet (mirrors backend constant) */
export const MAX_PHOTOS = 6;

/** Minimum number of photos required */
export const MIN_PHOTOS = 2;

/**
 * A photo entry in the form, either a newly-picked local image or an
 * already-uploaded remote photo.
 */
export interface FormPhoto {
  /** Stable key for React list rendering */
  key: string;
  /** URI shown in the UI (local file:// or remote https://) */
  uri: string;
  /** Set for photos that already exist on the backend */
  remoteId?: string;
}

export interface UsePetPhotoManagerOptions {
  /** Existing photos to seed (edit mode) */
  initialPhotos?: PetPhoto[];
}

export interface UsePetPhotoManagerReturn {
  photos: FormPhoto[];
  maxPhotos: number;
  minPhotos: number;
  isUploading: boolean;
  addPhotoFromLibrary: () => Promise<void>;
  addPhotoFromCamera: () => Promise<void>;
  /** Add multiple photos to the list */
  addPhotos: (uris: string[]) => void;
  /** Update a photo's URI (e.g. after cropping) */
  updatePhotoUri: (key: string, newUri: string) => void;
  /** Set the full photo list (for reordering) */
  reorderPhotos: (newPhotos: FormPhoto[]) => void;
  removePhoto: (key: string) => void;
  /** Upload all new local photos and sync removals/reorders for an existing pet */
  syncPhotosForAdd: (petId: string) => Promise<void>;
  syncPhotosForUpdate: (
    petId: string,
    originalPhotos: PetPhoto[],
  ) => Promise<void>;
}

export function usePetPhotoManager(
  options: UsePetPhotoManagerOptions = {},
): UsePetPhotoManagerReturn {
  const { initialPhotos } = options;
  const { uploadImage, isUploading } = useCloudinaryUpload();

  const pickerOptions = useMemo<ImagePickerOptions>(
    () => ({
      aspect: [3, 4],
      quality: 0.8,
      allowsEditing: false, // We use custom in-app cropping
    }),
    [],
  );

  const { pickImage, takePhoto } = useImagePicker(pickerOptions);
  const [photos, setPhotos] = useState<FormPhoto[]>([]);

  // Seed photos from existing pet (edit mode) once.
  // We track whether seeding has already happened with a ref so the effect
  // can safely list every dependency without re-seeding on every render.
  const seededRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current && initialPhotos && initialPhotos.length > 0) {
      seededRef.current = true;
      setPhotos(
        initialPhotos.map((p: PetPhoto) => ({
          key: p.id,
          uri: p.image_url,
          remoteId: p.id,
        })),
      );
    }
  }, [initialPhotos]);

  const addPhotos = useCallback((uris: string[]) => {
    const photosWithKeys = uris.map((uri) => ({ key: uuidv4(), uri }));

    setPhotos((prev) => {
      const remainingSlots = MAX_PHOTOS - prev.length;
      const urisToAdd = photosWithKeys.slice(0, remainingSlots);

      if (urisToAdd.length > 0) {
        return [...prev, ...urisToAdd];
      }
      return prev;
    });
  }, []);
  const updatePhotoUri = useCallback((key: string, newUri: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.key === key ? { ...p, uri: newUri } : p)),
    );
  }, []);

  const reorderPhotos = useCallback((newPhotos: FormPhoto[]) => {
    setPhotos(newPhotos);
  }, []);

  const addPhotoFromLibrary = useCallback(async () => {
    logger.info('usePetPhotoManager: addPhotoFromLibrary called');

    const slots = MAX_PHOTOS - photos.length;
    if (slots <= 0) {
      logger.warn('usePetPhotoManager: Max photos reached');
      return;
    }

    const result = await pickImage({
      allowsMultipleSelection: true,
      selectionLimit: slots,
    });

    logger.info('usePetPhotoManager: pickImage result', {
      canceled: result.canceled,
      urisCount: result.uris.length,
    });

    if (!result.canceled && result.uris.length > 0) {
      addPhotos(result.uris);
    }
  }, [photos.length, pickImage, addPhotos]);

  const addPhotoFromCamera = useCallback(async () => {
    logger.info('usePetPhotoManager: addPhotoFromCamera called');

    if (photos.length >= MAX_PHOTOS) {
      logger.warn('usePetPhotoManager: Max photos reached');
      return;
    }

    const result = await takePhoto();
    logger.info('usePetPhotoManager: takePhoto result', {
      canceled: result.canceled,
      uri: result.uri,
    });

    if (!result.canceled && result.uri) {
      addPhotos([result.uri]);
    }
  }, [photos.length, takePhoto, addPhotos]);

  const removePhoto = useCallback((key: string) => {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  }, []);

  const syncPhotosForAdd = useCallback(
    async (petId: string) => {
      for (const photo of photos) {
        try {
          const url = await uploadImage(photo.uri, 'pet', petId);
          await PetService.addPhoto(petId, url);
        } catch (e) {
          logger.error('Photo upload failed', { error: e });
          throw e;
        }
      }
    },
    [photos, uploadImage],
  );

  const syncPhotosForUpdate = useCallback(
    async (petId: string, originalPhotos: PetPhoto[]) => {
      const originalRemoteIds = new Set(originalPhotos.map((p) => p.id));
      const currentRemoteIds = new Set(
        photos
          .filter(
            (p): p is typeof p & { remoteId: string } =>
              typeof p.remoteId === 'string',
          )
          .map((p) => p.remoteId),
      );

      // Remove deleted photos
      const removedIds = [...originalRemoteIds].filter(
        (id) => !currentRemoteIds.has(id),
      );
      for (const photoId of removedIds) {
        try {
          await PetService.removePhoto(petId, photoId);
        } catch (e) {
          logger.error('Failed to remove photo', { error: e });
        }
      }

      // Upload new local photos
      const newPhotos = photos.filter((p) => !p.remoteId);
      for (const photo of newPhotos) {
        try {
          const url = await uploadImage(photo.uri, 'pet', petId);
          await PetService.addPhoto(petId, url);
        } catch (e) {
          logger.error('Photo upload/attach failed', { error: e });
        }
      }

      // Reorder: collect remote IDs in current display order
      const orderedIds = photos
        .filter(
          (p): p is typeof p & { remoteId: string } =>
            typeof p.remoteId === 'string' && currentRemoteIds.has(p.remoteId),
        )
        .map((p) => p.remoteId);

      if (orderedIds.length > 1) {
        try {
          await PetService.reorderPhotos(petId, orderedIds);
        } catch (e) {
          logger.error('Failed to reorder photos', { error: e });
        }
      }
    },
    [photos, uploadImage],
  );

  return {
    photos,
    maxPhotos: MAX_PHOTOS,
    minPhotos: MIN_PHOTOS,
    isUploading,
    addPhotoFromLibrary,
    addPhotoFromCamera,
    addPhotos,
    updatePhotoUri,
    reorderPhotos,
    removePhoto,
    syncPhotosForAdd,
    syncPhotosForUpdate,
  };
}
