// Uploads one file the way the server expects: ask for a short-lived signed URL, PUT the bytes straight to storage,
// and hand the returned key to whatever call references it (profile photo, job photos, Aadhaar, work proof).
// Nothing here pretends an upload worked: any failure is thrown as an ApiError for the screen to show.
//
// Why two paths: the signed link commits to an exact Content-Type and byte count, and the server (like S3) refuses
// anything else. React Native's fetch builds a Blob body from the blob's OWN type — a blob read from a file:// URI
// has an empty or octet-stream type — so the header we set was being dropped on the wire and every upload came back
// 403 "Content-Type does not match the upload link". On native we therefore stream the file itself with
// expo-file-system, which sends exactly the headers we pass and a correct Content-Length. The web build keeps fetch,
// where the Blob body and the header agree.
import { Platform } from 'react-native';
import { File, UploadType } from 'expo-file-system';
import { post } from './client';
import { ApiError } from './errors';
import type { MediaPurpose, PresignResult } from './types';

export interface PickedFile {
  uri: string;
  /** image/jpeg, image/png or image/webp (audio for voice notes) */
  contentType: string;
}

const SUPPORTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp'];

/** A file:// path expo-file-system can stream. Anything else (data:, blob:, content://) goes through fetch. */
function streamable(uri: string): boolean {
  return Platform.OS !== 'web' && uri.startsWith('file://');
}

/** Reads the picked file into bytes. Works for file:// and blob:/data: URIs alike (fetch handles all three). */
async function readBytes(uri: string): Promise<Blob> {
  try {
    const response = await fetch(uri);
    return await response.blob();
  } catch {
    throw new ApiError(0, 'FILE_UNREADABLE', 'The selected file could not be read');
  }
}

/** The byte count the presign has to commit to — from the file itself where we can, without reading it into memory. */
async function sizeOf(file: PickedFile): Promise<{ sizeBytes: number; blob?: Blob }> {
  if (streamable(file.uri)) {
    const handle = new File(file.uri);
    if (!handle.exists || handle.size <= 0)
      throw new ApiError(0, 'FILE_UNREADABLE', 'The selected file could not be read');
    return { sizeBytes: handle.size };
  }
  const blob = await readBytes(file.uri);
  return { sizeBytes: blob.size, blob };
}

interface Refusal {
  status: number;
  body: string;
}

export async function uploadFile(purpose: MediaPurpose, file: PickedFile): Promise<string> {
  const isImage = purpose !== 'JOB_VOICE';
  if (isImage && !SUPPORTED_IMAGES.includes(file.contentType))
    throw new ApiError(422, 'UNSUPPORTED_FILE', 'Please choose a JPEG, PNG or WebP image');

  const { sizeBytes, blob } = await sizeOf(file);
  const presign = await post<PresignResult>('/media/presign', {
    purpose,
    contentType: file.contentType,
    sizeBytes,
  });

  // Send exactly the headers the server signed (Content-Type), nothing more
  const headers = { ...presign.headers };
  const refusal = blob
    ? await putBlob(presign, headers, blob)
    : await putFile(presign, headers, file.uri);
  if (refusal) {
    const reason = shorten(refusal.body);
    console.warn(`[upload] ${purpose} refused with ${refusal.status}: ${reason || '(no body)'}`);
    throw new ApiError(
      refusal.status,
      'UPLOAD_FAILED',
      `Storage refused the upload (${refusal.status})${reason ? `: ${reason}` : ''}`,
    );
  }
  return presign.key;
}

/** Native: stream the file straight from disk, so the signed Content-Type and a real Content-Length go on the wire. */
async function putFile(presign: PresignResult, headers: Record<string, string>, uri: string): Promise<Refusal | null> {
  let result: { status: number; body: string };
  try {
    result = await new File(uri).upload(presign.uploadUrl, {
      httpMethod: presign.method,
      uploadType: UploadType.BINARY_CONTENT,
      headers,
      // iOS defaults to a background URLSession, which the system may delay; the person is waiting on this screen
      sessionType: 'foreground',
    });
  } catch {
    throw new ApiError(0, 'UPLOAD_FAILED', 'The upload could not reach storage. Check your connection and try again.');
  }
  return result.status >= 200 && result.status < 300 ? null : { status: result.status, body: result.body };
}

/** Web (and any URI we cannot stream): the Blob body and the header agree, so fetch is fine. */
async function putBlob(presign: PresignResult, headers: Record<string, string>, blob: Blob): Promise<Refusal | null> {
  let response: Response;
  try {
    response = await fetch(presign.uploadUrl, { method: presign.method, headers, body: blob });
  } catch {
    throw new ApiError(0, 'UPLOAD_FAILED', 'The upload could not reach storage. Check your connection and try again.');
  }
  if (response.ok) return null;
  let body = '';
  try {
    body = await response.text();
  } catch {
    // no body to read
  }
  return { status: response.status, body };
}

/** The server's own explanation (dev storage answers JSON { message }, S3 answers XML <Message>), shortened. */
function shorten(text: string): string {
  try {
    const json = JSON.parse(text) as { message?: unknown; error?: { message?: unknown } };
    const message = json.error?.message ?? json.message;
    if (typeof message === 'string') return message.slice(0, 160);
  } catch {
    // not JSON
  }
  const xml = /<Message>([^<]*)<\/Message>/.exec(text);
  return (xml?.[1] ?? text).trim().slice(0, 160);
}
