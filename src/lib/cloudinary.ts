/**
 * SHA-1 hashing helper using browser Web Crypto API
 */
async function sha1(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-1', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Uploads a file or base64 image directly to Cloudinary from frontend.
 * Returns the secure Cloudinary HTTP URL (e.g., https://res.cloudinary.com/Root/image/upload/v.../prabugym/members/...).
 */
export async function uploadToCloudinary(fileOrBase64: File | string, folder = 'prabugym/members'): Promise<string> {
  if (!fileOrBase64) return '';

  // If input is already an HTTP/HTTPS URL and not a base64 data URI, return as-is
  if (
    typeof fileOrBase64 === 'string' &&
    (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://')) &&
    !fileOrBase64.startsWith('data:')
  ) {
    return fileOrBase64;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME || process.env.CLOUD_NAME || 'o4dw9xs7';
  const cloudKey = process.env.NEXT_PUBLIC_CLOUD_KEY || process.env.CLOUD_KEY || '158921622194534';
  const cloudSecret = process.env.NEXT_PUBLIC_CLOUD_SECRET || process.env.CLOUD_SECRET || 'rhSXAgzuCDdxFWP_diMAb0isYHA';

  const timestamp = Math.floor(Date.now() / 1000).toString();

  try {
    // Attempt signed upload using SHA-1 signature
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${cloudSecret}`;
    const signature = await sha1(stringToSign);

    const formData = new FormData();
    formData.append('file', fileOrBase64);
    formData.append('api_key', cloudKey);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }

    if (data.error) {
      console.warn('Signed Cloudinary upload failed, attempting fallback:', data.error.message);
    }
  } catch (err) {
    console.warn('Signed Cloudinary upload exception:', err);
  }

  // Unsigned fallback attempt
  try {
    const unsignedData = new FormData();
    unsignedData.append('file', fileOrBase64);
    unsignedData.append('upload_preset', 'ml_default');

    const unsignedResp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: unsignedData,
    });
    const unsignedResData = await unsignedResp.json();
    if (unsignedResData.secure_url) {
      return unsignedResData.secure_url;
    }
  } catch (err) {
    console.error('Unsigned Cloudinary upload failed:', err);
  }

  throw new Error('Gagal mengunggah foto ke Cloudinary. Periksa jaringan atau kredensial Cloudinary.');
}
