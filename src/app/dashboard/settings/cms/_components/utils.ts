// Client-side WebP Image Compressor & Converter (Resizes to max 1920px & converts to WebP)
export const compressAndConvertToWebP = (
  file: File,
  quality = 0.8,
  maxWidth = 1920
): Promise<{ blob: Blob; fileName: string }> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ blob: file, fileName: file.name });
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const webpFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            resolve({ blob, fileName: webpFileName });
          } else {
            resolve({ blob: file, fileName: file.name });
          }
        },
        'image/webp',
        quality
      );
    };
    img.onerror = (err) => reject(err);
  });
};
