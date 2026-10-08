/**
 * The product photo as a `File`, so it can go to WhatsApp together with the
 * message through the system share sheet (`navigator.share`).
 *
 * WhatsApp's share link only carries text; a picture can only travel through
 * the share sheet, which needs a real file. Shopee's image CDN answers with
 * `Access-Control-Allow-Origin: *`, so the browser can download it directly.
 */

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** `oferta-<itemId>.<ext>`, the name WhatsApp and the downloads folder show. */
export function imageFileName(itemId: string, mimeType: string): string {
  const safeId = itemId.replace(/[^\w-]/g, "") || "produto";
  return `oferta-${safeId}.${EXTENSIONS[mimeType] ?? "jpg"}`;
}

/** Downloads the photo. Resolves to `null` on any failure; sharing then falls back to text. */
export async function fetchImageFile(url: string, itemId: string, signal?: AbortSignal): Promise<File | null> {
  try {
    const response = await fetch(url, { mode: "cors", signal });
    if (!response.ok) return null;

    const blob = await response.blob();
    // Some CDNs answer `application/octet-stream`; Shopee serves JPEG.
    const type = blob.type.startsWith("image/") ? blob.type : "image/jpeg";

    return new File([blob], imageFileName(itemId, type), { type });
  } catch {
    return null;
  }
}

/** True when this browser can hand the photo and the text to another app. */
export function canShareImage(file: File | null, text: string): file is File {
  if (file === null || typeof navigator === "undefined") return false;
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") return false;

  try {
    return navigator.canShare({ files: [file], text });
  } catch {
    return false;
  }
}
