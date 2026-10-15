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
    // Send exactly the headers the server signed (Content-Type), nothing more
    response = await fetch(presign.uploadUrl, { method: presign.method, headers: { ...presign.headers }, body: blob });
  } catch {
    throw new ApiError(0, 'UPLOAD_FAILED', 'The upload could not reach storage. Check your connection and try again.');
  }
  if (!response.ok) {
    const reason = await refusalReason(response);
    console.warn(`[upload] ${purpose} refused with ${response.status}: ${reason || '(no body)'}`);
    throw new ApiError(response.status, 'UPLOAD_FAILED', `Storage refused the upload (${response.status})${reason ? `: ${reason}` : ''}`);
  }
  return presign.key;
}

/** The server's own explanation (dev storage answers JSON { message }, S3 answers XML <Message>), shortened. */
async function refusalReason(response: Response): Promise<string> {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text) as { message?: unknown; error?: { message?: unknown } };
      const message = json.error?.message ?? json.message;
      if (typeof message === 'string') return message.slice(0, 160);
    } catch {
      // not JSON
    }
    const xml = /<Message>([^<]*)<\/Message>/.exec(text);
    return (xml?.[1] ?? text).trim().slice(0, 160);
  } catch {
    return '';
  }
}
