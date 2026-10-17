import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ImagePicker from 'expo-image-picker';
import { captureFromCamera, pickFromGallery, pickImage } from './pickImage';

vi.mock('expo-image-picker', () => ({
  PermissionStatus: {
    GRANTED: 'granted',
    UNDETERMINED: 'undetermined',
    DENIED: 'denied',
  },
  requestMediaLibraryPermissionsAsync: vi.fn(),
  requestCameraPermissionsAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  launchCameraAsync: vi.fn(),
}));

describe('pickImage utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('pickFromGallery / pickImage', () => {
    it('throws error when media library permission is denied', async () => {
      vi.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce({
        granted: false,
        status: ImagePicker.PermissionStatus.DENIED,
        canAskAgain: true,
        expires: 'never',
      });

      await expect(pickFromGallery()).rejects.toThrow(/Allow access to your photos/);
    });

    it('returns null when picker is canceled', async () => {
      vi.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce({
        granted: true,
        status: ImagePicker.PermissionStatus.GRANTED,
        canAskAgain: true,
        expires: 'never',
      });
      vi.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
        canceled: true,
        assets: null,
      });

      const res = await pickFromGallery();
      expect(res).toBeNull();
    });

    it('returns PickedFile with normalized mime type for jpg', async () => {
      vi.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce({
        granted: true,
        status: ImagePicker.PermissionStatus.GRANTED,
        canAskAgain: true,
        expires: 'never',
      });
      vi.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///path/photo.jpg',
            width: 100,
            height: 100,
            mimeType: 'image/jpg',
          },
        ],
      });

      const res = await pickFromGallery();
      expect(res).toEqual({
        uri: 'file:///path/photo.jpg',
        contentType: 'image/jpeg',
      });
    });

    it('exports pickImage as alias of pickFromGallery', () => {
      expect(pickImage).toBe(pickFromGallery);
    });
  });

  describe('captureFromCamera', () => {
    it('throws error when camera permission is denied', async () => {
      vi.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValueOnce({
        granted: false,
        status: ImagePicker.PermissionStatus.DENIED,
        canAskAgain: true,
        expires: 'never',
      });

      await expect(captureFromCamera()).rejects.toThrow(/Allow camera access/);
    });

    it('returns PickedFile when camera capture succeeds', async () => {
      vi.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValueOnce({
        granted: true,
        status: ImagePicker.PermissionStatus.GRANTED,
        canAskAgain: true,
        expires: 'never',
      });
      vi.mocked(ImagePicker.launchCameraAsync).mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///camera/shot.png',
            width: 800,
            height: 600,
            mimeType: 'image/png',
          },
        ],
      });

      const res = await captureFromCamera();
      expect(res).toEqual({
        uri: 'file:///camera/shot.png',
        contentType: 'image/png',
      });
    });

    it('returns null when camera capture is canceled', async () => {
      vi.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValueOnce({
        granted: true,
        status: ImagePicker.PermissionStatus.GRANTED,
        canAskAgain: true,
        expires: 'never',
      });
      vi.mocked(ImagePicker.launchCameraAsync).mockResolvedValueOnce({
        canceled: true,
        assets: null,
      });

      const res = await captureFromCamera();
      expect(res).toBeNull();
    });
  });
});
