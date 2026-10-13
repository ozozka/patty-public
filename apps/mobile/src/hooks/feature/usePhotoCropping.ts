import { useState } from 'react';
import type { FormPhoto } from 'src/hooks/scenario/usePetFormScenario';

interface UsePhotoCroppingOptions {
  photos: FormPhoto[];
  onUpdatePhotoUri: (key: string, uri: string) => void;
}

export function usePhotoCropping({
  photos,
  onUpdatePhotoUri,
}: UsePhotoCroppingOptions) {
  const [croppingKey, setCroppingKey] = useState<string | null>(null);

  const croppingPhoto = photos.find((p) => p.key === croppingKey);

  const handleCropConfirm = (croppedUri: string) => {
    if (croppingKey) {
      onUpdatePhotoUri(croppingKey, croppedUri);
      setCroppingKey(null);
    }
  };

  return {
    croppingKey,
    setCroppingKey,
    croppingPhoto,
    handleCropConfirm,
  };
}
