import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

/**
 * Extrae el fileKey de una URL de UploadThing.
 * UTApi.deleteFiles espera el fileKey (lo que está entre `/f/` y el primer `_`
 * o el final), NO la URL completa.
 *
 *   https://utfs.io/f/abc123_uuid_nombre.jpg  →  abc123_uuid_nombre.jpg
 */
export function extractFileKey(url: string): string | null {
  if (!url) return null;
  // Soporta tanto URLs absolutas (https://utfs.io/f/KEY) como keys crudas.
  const lastSegment = url.substring(url.lastIndexOf('/') + 1);
  return lastSegment || null;
}

/**
 * Borra archivos de UploadThing a partir de URLs (o fileKeys crudos).
 *
 * - No rompe la operación principal si la API falla: cualquier error se
 *   loguea y se descarta. La idea es que un fallo de UploadThing no impida
 *   que la mutación de la DB se confirme.
 * - Sanea input: filtra vacíos, nulos, y strings que no parezcan keys válidas.
 * - Dedup: si pasás la misma URL dos veces, lo borra una sola vez.
 */
export async function deleteUTFiles(urls: Array<string | null | undefined>): Promise<void> {
  const fileKeys = Array.from(
    new Set(
      urls
        .filter((u): u is string => typeof u === 'string' && u.length > 0)
        .map(extractFileKey)
        .filter((k): k is string => Boolean(k))
    )
  );

  if (fileKeys.length === 0) return;

  try {
    await utapi.deleteFiles(fileKeys);
  } catch (error) {
    console.error('[uploadthing] Error deleting files from UploadThing:', error);
  }
}
