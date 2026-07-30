/**
 * Preload and convert image URL to Base64 Data URL for HTML5 Canvas / html-to-image rendering.
 * Handled gracefully for iOS Chrome, iOS Safari, Android Chrome, and Desktop browsers.
 */
export async function toDataURL(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  return new Promise((resolve) => {
    const img = new Image();
    // Only set crossOrigin if url is remote (http/https not matching current origin)
    if (typeof window !== 'undefined' && url.startsWith('http') && !url.includes(window.location.host)) {
      img.crossOrigin = 'Anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 300;
        canvas.height = img.naturalHeight || img.height || 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          if (dataURL && dataURL.startsWith('data:image')) {
            return resolve(dataURL);
          }
        }
      } catch (e) {
        // Fallback to fetch
      }
      resolve(url);
    };

    img.onerror = async () => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string || url);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      } catch (err) {
        resolve(url);
      }
    };

    img.src = url;
  });
}
