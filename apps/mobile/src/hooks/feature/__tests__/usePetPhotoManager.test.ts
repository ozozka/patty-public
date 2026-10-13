import type { PetPhoto } from '@patty/contracts';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  MAX_PHOTOS,
  MIN_PHOTOS,
  usePetPhotoManager,
} from '../usePetPhotoManager';

// --- Mocks ---

const mockUploadImage = jest.fn();
jest.mock('src/hooks/feature/useCloudinaryUpload', () => ({
  useCloudinaryUpload: () => ({
    uploadImage: mockUploadImage,
    isUploading: false,
  }),
}));

const mockPickImage = jest.fn();
const mockTakePhoto = jest.fn();
jest.mock('src/hooks/feature/useImagePicker', () => ({
  useImagePicker: () => ({
    pickImage: mockPickImage,
    takePhoto: mockTakePhoto,
  }),
}));

const mockAddPhoto = jest.fn();
const mockRemovePhoto = jest.fn();
const mockReorderPhotos = jest.fn();
jest.mock('src/service/PetService', () => ({
  PetService: {
    addPhoto: (...args: unknown[]) => mockAddPhoto(...args),
    removePhoto: (...args: unknown[]) => mockRemovePhoto(...args),
    reorderPhotos: (...args: unknown[]) => mockReorderPhotos(...args),
  },
}));

jest.mock('src/utils/uuid', () => ({ uuidv4: () => 'uuid-mock' }));
jest.mock('src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// --- Helpers ---

function makeRemotePhoto(id: string): PetPhoto {
  return {
    id,
    pet_id: 'pet-test',
    image_url: `https://cdn.example.com/${id}.jpg`,
    display_order: 0,
    created_at: new Date().toISOString(),
  };
}

// --- Tests ---

describe('usePetPhotoManager', () => {
  beforeEach(() => {
    mockPickImage.mockReset();
    mockTakePhoto.mockReset();
    mockUploadImage.mockReset();
    mockAddPhoto.mockReset();
    mockRemovePhoto.mockReset();
    mockReorderPhotos.mockReset();
  });

  it('starts with empty photos when no initialPhotos', () => {
    const { result } = renderHook(() => usePetPhotoManager());
    expect(result.current.photos).toEqual([]);
  });

  it('seeds photos from initialPhotos in edit mode', () => {
    const initial = [makeRemotePhoto('photo-1'), makeRemotePhoto('photo-2')];
    const { result } = renderHook(() =>
      usePetPhotoManager({ initialPhotos: initial }),
    );
    expect(result.current.photos).toHaveLength(2);
    expect(result.current.photos[0]).toMatchObject({
      key: 'photo-1',
      uri: 'https://cdn.example.com/photo-1.jpg',
      remoteId: 'photo-1',
    });
  });

  it('exposes correct constants', () => {
    const { result } = renderHook(() => usePetPhotoManager());
    expect(result.current.maxPhotos).toBe(MAX_PHOTOS);
    expect(result.current.minPhotos).toBe(MIN_PHOTOS);
  });

  describe('addPhotoFromLibrary', () => {
    it('appends a photo when picker returns an image', async () => {
      mockPickImage.mockResolvedValue({
        canceled: false,
        uri: 'file://local.jpg',
        uris: ['file://local.jpg'],
      });

      const { result } = renderHook(() => usePetPhotoManager());

      await act(async () => {
        await result.current.addPhotoFromLibrary();
      });

      expect(result.current.photos).toHaveLength(1);
      expect(result.current.photos[0]?.uri).toBe('file://local.jpg');
    });

    it('does nothing when picker is cancelled', async () => {
      mockPickImage.mockResolvedValue({
        canceled: true,
        uri: null,
        uris: [],
      });

      const { result } = renderHook(() => usePetPhotoManager());

      await act(async () => {
        await result.current.addPhotoFromLibrary();
      });

      expect(result.current.photos).toHaveLength(0);
    });

    it('does not add photo when MAX_PHOTOS reached', async () => {
      // Pre-fill with MAX_PHOTOS entries via repeated picker calls
      mockPickImage.mockResolvedValue({
        canceled: false,
        uri: 'file://x.jpg',
        uris: ['file://x.jpg'],
      });

      const { result } = renderHook(() => usePetPhotoManager());

      for (let i = 0; i < MAX_PHOTOS; i++) {
        await act(async () => {
          await result.current.addPhotoFromLibrary();
        });
      }

      // One more call should be a no-op
      await act(async () => {
        await result.current.addPhotoFromLibrary();
      });

      expect(result.current.photos).toHaveLength(MAX_PHOTOS);
      expect(mockPickImage).toHaveBeenCalledTimes(MAX_PHOTOS);
    });
  });

  describe('addPhotoFromCamera', () => {
    it('appends a photo when camera returns an image', async () => {
      mockTakePhoto.mockResolvedValue({
        canceled: false,
        uri: 'file://camera.jpg',
        uris: ['file://camera.jpg'],
      });

      const { result } = renderHook(() => usePetPhotoManager());

      await act(async () => {
        await result.current.addPhotoFromCamera();
      });

      expect(result.current.photos).toHaveLength(1);
      expect(result.current.photos[0]?.uri).toBe('file://camera.jpg');
    });
  });

  describe('removePhoto', () => {
    it('removes a photo by key', async () => {
      mockPickImage.mockResolvedValue({
        canceled: false,
        uri: 'file://a.jpg',
        uris: ['file://a.jpg'],
      });

      const { result } = renderHook(() => usePetPhotoManager());

      await act(async () => {
        await result.current.addPhotoFromLibrary();
      });

      const key = result.current.photos[0]?.key;
      if (!key) throw new Error('Photo key not found');

      act(() => {
        result.current.removePhoto(key);
      });

      expect(result.current.photos).toHaveLength(0);
    });
  });

  describe('reorderPhotos', () => {
    it('updates photo list with new order', () => {
      const initial = [
        makeRemotePhoto('p1'),
        makeRemotePhoto('p2'),
        makeRemotePhoto('p3'),
      ];
      const { result } = renderHook(() =>
        usePetPhotoManager({ initialPhotos: initial }),
      );

      const p0 = result.current.photos[0];
      const p1 = result.current.photos[1];
      const p2 = result.current.photos[2];

      if (!p0 || !p1 || !p2) throw new Error('Photos not seeded');

      const newOrder = [p1, p0, p2];

      act(() => {
        result.current.reorderPhotos(newOrder);
      });

      expect(result.current.photos).toEqual(newOrder);
    });
  });

  describe('syncPhotosForAdd', () => {
    it('uploads all photos and attaches them to the pet', async () => {
      mockPickImage.mockResolvedValue({
        canceled: false,
        uri: 'file://new.jpg',
        uris: ['file://new.jpg'],
      });
      mockUploadImage.mockResolvedValue('https://cdn.example.com/new.jpg');
      mockAddPhoto.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePetPhotoManager());

      await act(async () => {
        await result.current.addPhotoFromLibrary();
      });

      await act(async () => {
        await result.current.syncPhotosForAdd('pet-999');
      });

      expect(mockUploadImage).toHaveBeenCalledWith(
        'file://new.jpg',
        'pet',
        'pet-999',
      );
      expect(mockAddPhoto).toHaveBeenCalledWith(
        'pet-999',
        'https://cdn.example.com/new.jpg',
      );
    });

    it('throws when upload fails', async () => {
      mockPickImage.mockResolvedValue({
        canceled: false,
        uri: 'file://bad.jpg',
        uris: ['file://bad.jpg'],
      });
      mockUploadImage.mockRejectedValue(new Error('Upload failed'));

      const { result } = renderHook(() => usePetPhotoManager());

      await act(async () => {
        await result.current.addPhotoFromLibrary();
      });

      await expect(
        act(async () => {
          await result.current.syncPhotosForAdd('pet-999');
        }),
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('syncPhotosForUpdate', () => {
    it('removes deleted photos', async () => {
      const original = [makeRemotePhoto('old-1'), makeRemotePhoto('old-2')];
      mockRemovePhoto.mockResolvedValue(undefined);

      // Start with both remote photos seeded, then remove one
      const { result } = renderHook(() =>
        usePetPhotoManager({ initialPhotos: original }),
      );

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(2);
      });

      act(() => {
        result.current.removePhoto('old-1');
      });

      await act(async () => {
        await result.current.syncPhotosForUpdate('pet-1', original);
      });

      expect(mockRemovePhoto).toHaveBeenCalledWith('pet-1', 'old-1');
      expect(mockRemovePhoto).not.toHaveBeenCalledWith('pet-1', 'old-2');
    });

    it('uploads new local photos and attaches them', async () => {
      mockPickImage.mockResolvedValue({
        canceled: false,
        uri: 'file://new.jpg',
        uris: ['file://new.jpg'],
      });
      mockUploadImage.mockResolvedValue('https://cdn.example.com/new.jpg');
      mockAddPhoto.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePetPhotoManager());

      await act(async () => {
        await result.current.addPhotoFromLibrary();
      });

      await act(async () => {
        await result.current.syncPhotosForUpdate('pet-1', []);
      });

      expect(mockUploadImage).toHaveBeenCalledWith(
        'file://new.jpg',
        'pet',
        'pet-1',
      );
      expect(mockAddPhoto).toHaveBeenCalledWith(
        'pet-1',
        'https://cdn.example.com/new.jpg',
      );
    });

    it('reorders photos when multiple remote photos exist', async () => {
      const original = [makeRemotePhoto('r1'), makeRemotePhoto('r2')];
      mockReorderPhotos.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        usePetPhotoManager({ initialPhotos: original }),
      );

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(2);
      });

      // Swap order
      const p0 = result.current.photos[0];
      const p1 = result.current.photos[1];
      if (!p0 || !p1) throw new Error('Photos not found');

      const newOrder = [p1, p0];
      act(() => {
        result.current.reorderPhotos(newOrder);
      });

      await act(async () => {
        await result.current.syncPhotosForUpdate('pet-1', original);
      });

      expect(mockReorderPhotos).toHaveBeenCalledWith('pet-1', ['r2', 'r1']);
    });

    it('skips reorder when only one remote photo', async () => {
      const original = [makeRemotePhoto('r1')];

      const { result } = renderHook(() =>
        usePetPhotoManager({ initialPhotos: original }),
      );

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(1);
      });

      await act(async () => {
        await result.current.syncPhotosForUpdate('pet-1', original);
      });

      expect(mockReorderPhotos).not.toHaveBeenCalled();
    });
  });
});
