// Lets the person choose a photo from their device (a real file picker on web, the photo library on a phone) and
// returns what api/upload.ts needs. Returns null if they cancel; throws a readable Error if access is refused.
import * as ImagePicker from 'expo-image-picker';
import type { PickedFile } from '../api/upload';

const TYPE_BY_EXTENSION: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function guessType(uri: string, reported?: string | null): string {
  if (reported && reported.startsWith('image/')) return reported;
  const ext = uri.split('?')[0]?.split('.').pop()?.toLowerCase() ?? '';
  return TYPE_BY_EXTENSION[ext] ?? 'image/jpeg';
}

export async function pickImage(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Allow access to your photos to choose a picture. / फ़ोटो तक पहुंच की अनुमति दें');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.7, // keeps phone photos well under the server's 5 MB limit
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, contentType: guessType(asset.uri, asset.mimeType) };
}
