/**
 * Client-side photo resize and compression using the Canvas API.
 *
 * Used during Family Faces setup to shrink photos to ~300×300 JPEG
 * before storing as base64 in Firestore. This avoids any dependency
 * on Firebase Storage (which requires the paid Blaze plan).
 */

const MAX_DIMENSION = 300;
const JPEG_QUALITY = 0.65;
const MAX_BASE64_BYTES = 500_000; // 500KB ceiling — well under Firestore's 1MiB doc limit

/**
 * Resize and compress an image file to a base64 JPEG string.
 *
 * @param file  The raw File from an <input type="file"> element
 * @returns     A base64-encoded JPEG string (without the data:... prefix)
 * @throws      If the compressed result still exceeds 500KB
 */
export function resizeAndCompressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");

        // Scale down to fit within MAX_DIMENSION while preserving aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round(height * (MAX_DIMENSION / width));
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round(width * (MAX_DIMENSION / height));
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        // Strip the "data:image/jpeg;base64," prefix — we store raw base64
        const base64 = dataUrl.split(",")[1];

        // Approximate byte size of the base64 string
        const byteSize = Math.ceil((base64.length * 3) / 4);

        if (byteSize > MAX_BASE64_BYTES) {
          reject(
            new Error(
              `Photo is still ${Math.round(byteSize / 1024)}KB after compression. ` +
              `Please use a smaller or simpler photo (maximum ~${Math.round(MAX_BASE64_BYTES / 1024)}KB after compression).`
            )
          );
          return;
        }

        resolve(base64);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a stored base64 string back to a data URL for rendering in <img>.
 */
export function base64ToDataUrl(base64: string): string {
  return `data:image/jpeg;base64,${base64}`;
}
