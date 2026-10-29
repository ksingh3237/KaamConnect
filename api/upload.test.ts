import { beforeEach, describe, expect, it, vi } from 'vitest';

const platform = vi.hoisted(() => ({ os: 'android' }));
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return platform.os;
    },
  },
}));

// One fake file on disk, and the record of what was sent to the signed URL
const fsMock = vi.hoisted(() => ({
  file: { exists: true, size: 4096 },
  upload: vi.fn(),
}));
vi.mock('expo-file-system', () => ({
  UploadType: { BINARY_CONTENT: 0, MULTIPART: 1 },
  File: class {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
    get exists() {
      return fsMock.file.exists;
    }
    get size() {
      return fsMock.file.size;
    }
    upload = fsMock.upload;
  },
}));

const api = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('./client', () => ({ post: api.post }));

import { ApiError } from './errors';
import { uploadFile } from './upload';

const PRESIGNED = {
  uploadUrl: 'https://storage.example/api/v1/dev-storage/media/u/1/PROFILE_PHOTO/abc.jpg?sig=x',
  method: 'PUT' as const,
  headers: { 'Content-Type': 'image/jpeg' },
  key: 'u/1/PROFILE_PHOTO/abc.jpg',
  expiresInSec: 300,
};
const picked = { uri: 'file:///data/user/0/com.kaamconnect/cache/photo.jpg', contentType: 'image/jpeg' };

beforeEach(() => {
  vi.clearAllMocks();
  platform.os = 'android';
  fsMock.file = { exists: true, size: 4096 };
  api.post.mockResolvedValue(PRESIGNED);
  fsMock.upload.mockResolvedValue({ status: 200, body: '{"ok":true}', headers: {} });
  vi.stubGlobal('fetch', vi.fn());
});

describe('uploadFile on a phone', () => {
  it('streams the file itself, with exactly the headers the link was signed for', async () => {
    // The regression this guards: a Blob body made React Native send the blob's own (empty) type instead of
    // this header, and storage answered 403 "Content-Type does not match the upload link".
    expect(await uploadFile('PROFILE_PHOTO', picked)).toBe(PRESIGNED.key);

    expect(fsMock.upload).toHaveBeenCalledWith(PRESIGNED.uploadUrl, {
      httpMethod: 'PUT',
      uploadType: 0,
      headers: { 'Content-Type': 'image/jpeg' },
      sessionType: 'foreground',
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('asks the server to sign the real file size, without reading the bytes into memory', async () => {
    await uploadFile('AADHAAR', picked);
    expect(api.post).toHaveBeenCalledWith('/media/presign', {
      purpose: 'AADHAAR',
      contentType: 'image/jpeg',
      sizeBytes: 4096,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('passes storage’s own refusal on to the screen', async () => {
    fsMock.upload.mockResolvedValue({
      status: 403,
      body: '{"message":"Content-Type does not match the upload link"}',
      headers: {},
    });
    await expect(uploadFile('JOB_PHOTO', picked)).rejects.toMatchObject({
      status: 403,
      code: 'UPLOAD_FAILED',
      message: expect.stringContaining('Content-Type does not match the upload link'),
    });
  });

  it('says so plainly when the picked file is gone', async () => {
    fsMock.file = { exists: false, size: 0 };
    await expect(uploadFile('PROFILE_PHOTO', picked)).rejects.toMatchObject({ code: 'FILE_UNREADABLE' });
    expect(api.post).not.toHaveBeenCalled();
  });

  it('refuses a file type the server would reject anyway, before asking for a link', async () => {
    await expect(uploadFile('PROFILE_PHOTO', { uri: picked.uri, contentType: 'image/heic' })).rejects.toBeInstanceOf(ApiError);
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('uploadFile on the web', () => {
  beforeEach(() => {
    platform.os = 'web';
  });

  it('reads the blob and PUTs it, where the body and the header agree', async () => {
    const blob = { size: 1234 } as Blob;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) =>
        input === picked.uri ? { blob: async () => blob } : { ok: true, status: 200 },
      ),
    );

    expect(await uploadFile('PROFILE_PHOTO', picked)).toBe(PRESIGNED.key);
    expect(api.post).toHaveBeenCalledWith('/media/presign', expect.objectContaining({ sizeBytes: 1234 }));
    expect(fetch).toHaveBeenLastCalledWith(PRESIGNED.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: blob,
    });
    expect(fsMock.upload).not.toHaveBeenCalled();
  });

  it('reports what the server said when the PUT is refused', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) =>
        input === picked.uri
          ? { blob: async () => ({ size: 10 }) as Blob }
          : { ok: false, status: 403, text: async () => '<Error><Message>SignatureDoesNotMatch</Message></Error>' },
      ),
    );
    await expect(uploadFile('PROFILE_PHOTO', picked)).rejects.toMatchObject({
      status: 403,
      message: expect.stringContaining('SignatureDoesNotMatch'),
    });
  });
});
