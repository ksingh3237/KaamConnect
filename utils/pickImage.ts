// Lets the person add a photo: take one with the phone camera, or choose one from the library (a real file picker on web).
// Each returns what api/upload.ts needs, null if they cancel, and throws a readable Error if access is refused.
import { Platform } from 'react-native';
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

// Expo registers its Android camera / gallery launchers once, for the Activity the app started with. If Android
// recreates that Activity afterwards (a permission dialog on a low-memory phone, the developer option "Don't keep
// activities"), the launchers stop working until the app process restarts, and Expo reports a raw native exception.
// Show a sentence the person can act on instead of that stack trace.
const LAUNCHER_LOST = /unregistered ActivityResultLauncher/i;
const RESTART_HINT =
  'The camera could not open. Close KaamConnect completely (swipe it away in recent apps), open it again and retry. / ऐप को पूरी तरह बंद करके दोबारा खोलें';

async function launching<T>(open: () => Promise<T>): Promise<T> {
  try {
    return await open();
  } catch (error) {
    if (error instanceof Error && LAUNCHER_LOST.test(error.message)) throw new Error(RESTART_HINT);
    throw error;
  }
}

export async function pickFromGallery(): Promise<PickedFile | null> {
  // Android opens the system photo picker, which needs no permission: asking first only adds a dialog (and a
  // chance for Android to recreate the Activity, see above). iOS keeps its permission step.
  if (Platform.OS !== 'android') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error('Allow access to your photos to choose a picture. / फ़ोटो तक पहुंच की अनुमति दें');
  }
  return toPickedFile(
    await launching(() =>
      ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7, // keeps phone photos well under the server's 5 MB limit
      }),
    ),
  );
}

export async function captureFromCamera(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Allow camera access to take a photo. / फ़ोटो खींचने के लिए कैमरे की अनुमति दें');
  return toPickedFile(await launching(() => ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.7 })));
}

/** The original gallery-only picker, kept for existing callers. */
export const pickImage = pickFromGallery;
