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

const platform = vi.hoisted(() => ({ os: 'ios' }));
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return platform.os;
    },
  },
}));

describe('pickImage utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platform.os = 'ios';
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

  describe('Android launcher problems and permissions', () => {
    const granted = { granted: true, status: 'granted', canAskAgain: true, expires: 'never' } as const;
    const lost = () =>
      new Error(
        "Call to function 'ExponentImagePicker.launchCameraAsync' has been rejected. -> Caused by: java.lang.IllegalStateException: Attempting to launch an unregistered ActivityResultLauncher with contract expo.modules.imagepicker.contracts.CameraContract",
      );

    it('opens the Android gallery without asking for a permission first (the system picker needs none)', async () => {
      platform.os = 'android';
      vi.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({ canceled: true, assets: null });
      await pickFromGallery();
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).not.toHaveBeenCalled();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledTimes(1);
    });

    it('still asks for photo access on iOS before opening the gallery', async () => {
      platform.os = 'ios';
      vi.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce(granted as never);
      vi.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({ canceled: true, assets: null });
      await pickFromGallery();
      expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('turns the raw lost-launcher exception into a sentence the person can act on (camera)', async () => {
      platform.os = 'android';
      vi.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValueOnce(granted as never);
      vi.mocked(ImagePicker.launchCameraAsync).mockRejectedValueOnce(lost());
      await expect(captureFromCamera()).rejects.toThrow(/Close KaamConnect completely/);
    });

    it('does the same for the gallery', async () => {
      platform.os = 'android';
      vi.mocked(ImagePicker.launchImageLibraryAsync).mockRejectedValueOnce(lost());
      await expect(pickFromGallery()).rejects.toThrow(/Close KaamConnect completely/);
    });

    it('leaves every other error untouched', async () => {
      platform.os = 'android';
      vi.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValueOnce(granted as never);
      vi.mocked(ImagePicker.launchCameraAsync).mockRejectedValueOnce(new Error('Camera is in use by another app'));
      await expect(captureFromCamera()).rejects.toThrow('Camera is in use by another app');
    });
  });
});
