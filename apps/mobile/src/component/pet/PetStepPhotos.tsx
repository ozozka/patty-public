/** Step 3: Photos - Multi-photo upload with min 2/max 6 enforcement (Tinder-style) */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ImageCropModal } from 'src/component/common/ImageCropModal';
import { PhotoSelectionSheet } from 'src/component/common/PhotoSelectionSheet';
import { usePhotoCropping } from 'src/hooks/feature/usePhotoCropping';
import type { FormPhoto } from 'src/hooks/scenario/usePetFormScenario';

import { PetPhotoGrid } from './PetPhotoGrid';
import { PhotoTips } from './PhotoTips';

interface PetStepPhotosProps {
  name: string;
  photos: FormPhoto[];
  maxPhotos: number;
  minPhotos: number;
  onAddFromLibrary: () => void;
  onAddFromCamera: () => void;
  onRemovePhoto: (key: string) => void;
  onUpdatePhotoUri: (key: string, uri: string) => void;
  onReorderPhotos: (newPhotos: FormPhoto[]) => void;
  isLoading: boolean;
}

export function PetStepPhotos({
  name,
  photos,
  maxPhotos,
  minPhotos,
  onAddFromLibrary,
  onAddFromCamera,
  onRemovePhoto,
  onUpdatePhotoUri,
  onReorderPhotos,
  isLoading,
}: PetStepPhotosProps) {
  const { t } = useTranslation();

  const [isSheetVisible, setIsSheetVisible] = useState(false);

  const { croppingKey, setCroppingKey, croppingPhoto, handleCropConfirm } =
    usePhotoCropping({
      photos,
      onUpdatePhotoUri,
    });

  const remainingToMin = Math.max(0, minPhotos - photos.length);
  const photosLabel = t('pet.photos').toLowerCase();
  const separator = '/';
  const space = ' ';

  return (
    <View style={styles.container}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{t('pet.add_photos', { name })}</Text>
      </View>

      <View style={styles.tipsWrap}>
        <PhotoTips />
      </View>

      <View style={styles.descriptionWrap}>
        <Text style={styles.description}>
          {t('pet.photos_description', { min: minPhotos, max: maxPhotos })}
        </Text>
      </View>

      {remainingToMin > 0 && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            {t('pet.photos_min_error', { count: remainingToMin })}
          </Text>
        </View>
      )}

      <PetPhotoGrid
        photos={photos}
        onAddPhoto={() => setIsSheetVisible(true)}
        onRemovePhoto={onRemovePhoto}
        onCropPhoto={(key) => setCroppingKey(key)}
        onReorder={onReorderPhotos}
        isLoading={isLoading}
      />

      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {photos.length}
          {separator}
          {maxPhotos}
          {space}
          {photosLabel}
        </Text>
      </View>

      <PhotoSelectionSheet
        testID="pet-photo-sheet"
        isVisible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        onTakePhoto={onAddFromCamera}
        onChooseFromLibrary={onAddFromLibrary}
      />

      <ImageCropModal
        testID="pet-crop-modal"
        isVisible={!!croppingKey}
        uri={croppingPhoto?.uri ?? null}
        onCancel={() => setCroppingKey(null)}
        onConfirm={handleCropConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    width: '100%',
    paddingHorizontal: theme.spacing.xl + theme.spacing.md,
    paddingTop: theme.spacing.xl + theme.spacing.sm,
  },
  titleWrap: {
    marginBottom: theme.spacing.xl + theme.spacing.md,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.TEXT,
  },
  tipsWrap: {
    marginBottom: theme.spacing.md,
  },
  descriptionWrap: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.TEXT_SECONDARY,
  },
  errorBanner: {
    backgroundColor: theme.colors.SECONDARY + '33',
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.SECONDARY,
  },
  counter: {
    marginTop: theme.spacing.md,
  },
  counterText: {
    ...theme.typography.caption,
    textAlign: 'center',
    color: theme.colors.TEXT_MUTED,
  },
}));
