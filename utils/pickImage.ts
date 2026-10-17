// Lets the person add a photo: take one with the phone camera, or choose one from the library (a real file picker on web).
// Each returns what api/upload.ts needs, null if they cancel, and throws a readable Error if access is refused.
import * as ImagePicker from 'expo-image-picker';
import type { PickedFile } from '../api/upload';

const TYPE_BY_EXTENSION: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function guessType(uri: string, reported?: string | null): string {
  if (reported === 'image/jpg' || reported === 'image/pjpeg') return 'image/jpeg';
  if (reported && reported.startsWith('image/')) return reported;
  const ext = uri.split('?')[0]?.split('.').pop()?.toLowerCase() ?? '';
  return TYPE_BY_EXTENSION[ext] ?? 'image/jpeg';
}

function toPickedFile(result: ImagePicker.ImagePickerResult): PickedFile | null {
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? { uri: asset.uri, contentType: guessType(asset.uri, asset.mimeType) } : null;
}

export async function pickFromGallery(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Allow access to your photos to choose a picture. / फ़ोटो तक पहुंच की अनुमति दें');
  return toPickedFile(
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7, // keeps phone photos well under the server's 5 MB limit
    }),
  );
}

export async function captureFromCamera(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Allow camera access to take a photo. / फ़ोटो खींचने के लिए कैमरे की अनुमति दें');
  return toPickedFile(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.7 }));
}

/** The original gallery-only picker, kept for existing callers. */
export const pickImage = pickFromGallery;
