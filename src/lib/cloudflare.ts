import api from './api';

/**
 * Uploads a file or base64 image string to Cloudflare R2 via backend API.
 * Returns the public Cloudflare R2 URL (e.g. https://<CLOUDFLARE_ACCESS_LINK>/members/...).
 */
export async function uploadToCloudflare(
  fileOrBase64: File | string,
  folder = 'members'
): Promise<string> {
  if (!fileOrBase64) return '';

  // If input is already an HTTP/HTTPS URL and not a base64 data URI, return as-is
  if (
    typeof fileOrBase64 === 'string' &&
    (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://')) &&
    !fileOrBase64.startsWith('data:')
  ) {
    return fileOrBase64;
  }

  let base64String = '';

  if (typeof fileOrBase64 === 'string') {
    base64String = fileOrBase64;
  } else if (fileOrBase64 instanceof File) {
    base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBase64);
    });
  }

  if (!base64String) {
    throw new Error('Data foto tidak valid untuk diunggah.');
  }

  try {
    const res = await api.post<{ url: string }>('/admin/upload', {
      image: base64String,
      folder: folder,
    });

    if (res.success && res.data?.url) {
      return res.data.url;
    }

    throw new Error(res.error || 'Gagal mengunggah foto ke Cloudflare R2');
  } catch (err: any) {
    console.error('Cloudflare R2 upload error:', err);
    throw new Error(err.message || 'Gagal mengunggah foto ke Cloudflare R2. Periksa koneksi jaringan.');
  }
}
