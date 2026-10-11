// Uploads one file the way the server expects: ask for a short-lived signed URL, PUT the bytes straight to storage,
// and hand the returned key to whatever call references it (profile photo, job photos, Aadhaar, work proof).
// Nothing here pretends an upload worked: any failure is thrown as an ApiError for the screen to show.
import { post } from './client';
import { ApiError } from './errors';
import type { MediaPurpose, PresignResult } from './types';

export interface PickedFile {
  uri: string;
  /** image/jpeg, image/png or image/webp (audio for voice notes) */
  contentType: string;
}

const SUPPORTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp'];

/** Reads the picked file into bytes. Works for file:// and blob:/data: URIs alike (fetch handles all three). */
async function readBytes(uri: string): Promise<Blob> {
  try {
    const response = await fetch(uri);
    return await response.blob();
  } catch {
    throw new ApiError(0, 'FILE_UNREADABLE', 'The selected file could not be read');
  }
}

export async function uploadFile(purpose: MediaPurpose, file: PickedFile): Promise<string> {
  const isImage = purpose !== 'JOB_VOICE';
  if (isImage && !SUPPORTED_IMAGES.includes(file.contentType))
    throw new ApiError(422, 'UNSUPPORTED_FILE', 'Please choose a JPEG, PNG or WebP image');
  const blob = await readBytes(file.uri);
  const presign = await post<PresignResult>('/media/presign', {
    purpose,
    contentType: file.contentType,
    sizeBytes: blob.size,
  });
  let response: Response;
  try {
    response = await fetch(presign.uploadUrl, { method: presign.method, headers: presign.headers, body: blob });
  } catch {
    throw new ApiError(0, 'UPLOAD_FAILED', 'The upload could not reach storage');
  }
  if (!response.ok) throw new ApiError(response.status, 'UPLOAD_FAILED', `Storage refused the upload (${response.status})`);
  return presign.key;
}
