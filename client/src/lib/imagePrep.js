/**
 * Уменьшает изображение перед загрузкой: большое фото с телефона (4000×3000,
 * 8–12 МБ) сжимается до разумного размера, чтобы грузилось быстро и не упиралось
 * в лимиты хранилища. Учитывает EXIF-ориентацию (повёрнутые фото с телефона).
 *
 * При любой ошибке или для svg/gif возвращает исходный файл — деградация мягкая.
 */
export async function prepareImageForUpload(file, { maxDim = 1600, quality = 0.85 } = {}) {
  if (
    !file ||
    typeof file.type !== 'string' ||
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.type === 'image/gif'
  ) {
    return file;
  }

  // Небольшие картинки не трогаем
  if (file.size < 700 * 1024) return file;

  try {
    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      bitmap = await createImageBitmap(file);
    }

    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file; // не стало меньше — грузим оригинал

    const name = `${file.name.replace(/\.[^.]+$/, '') || 'cover'}.jpg`;
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}
