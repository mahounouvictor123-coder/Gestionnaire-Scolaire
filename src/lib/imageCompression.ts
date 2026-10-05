/**
 * Utilitaire de compression et d'optimisation d'images pour les épreuves scolaires
 * Réduit le poids des photos de téléphones (3-10 Mo) à 70-150 Ko
 * Tout en garantissant une netteté et une lisibilité parfaites pour l'OCR, Word et l'impression
 */

export const compressExamImage = (
  fileOrBase64: File | string,
  maxDimension: number = 1400,
  quality: number = 0.78
): Promise<{ dataUrl: string; sizeKb: number }> => {
  return new Promise((resolve) => {
    const processImage = (src: string) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Fill background with white for transparency / PNG safety
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL('image/jpeg', quality);
          const sizeKb = Math.round((compressed.length * 3) / 4 / 1024);
          resolve({ dataUrl: compressed, sizeKb });
        } else {
          const fallbackSize = Math.round((src.length * 3) / 4 / 1024);
          resolve({ dataUrl: src, sizeKb: fallbackSize });
        }
      };

      img.onerror = () => {
        const fallbackSize = Math.round((src.length * 3) / 4 / 1024);
        resolve({ dataUrl: src, sizeKb: fallbackSize });
      };

      img.src = src;
    };

    if (typeof fileOrBase64 === 'string') {
      processImage(fileOrBase64);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const raw = e.target?.result as string;
        processImage(raw);
      };
      reader.onerror = () => {
        resolve({ dataUrl: '', sizeKb: 0 });
      };
      reader.readAsDataURL(fileOrBase64);
    }
  });
};
