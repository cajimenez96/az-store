import { Prisma, type UploadPurpose } from '@prisma/client';
import { prisma } from '@/db/prisma';
import { deleteUTFiles } from '@/lib/uploadthing-helpers';

/**
 * Server-side helpers around the UploadedFile registry (AZ-005).
 *
 * The registry is the authority on who uploaded which UploadThing file:
 * a receipt URL is only trusted, and its file only deleted, when its key is
 * registered for the same user/order.
 */

// Hosts serving UploadThing files: legacy `utfs.io` or `<appid>.ufs.sh`.
const UFS_APP_HOST = /^[a-z0-9]+(?:-[a-z0-9]+)*\.ufs\.sh$/i;
// A single path segment made of URL-safe characters (no slashes, no `..`).
const FILE_KEY = /^[A-Za-z0-9_.-]+$/;

/**
 * Extracts the file key from an UploadThing file URL, or returns null when the
 * URL is not strictly `https://utfs.io/f/<key>` or `https://<appid>.ufs.sh/f/<key>`.
 */
export function parseUploadThingUrl(url: string): { key: string } | null {
  if (typeof url !== 'string' || url.length === 0) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') return null;
  if (parsed.username || parsed.password || parsed.port) return null;

  const host = parsed.hostname.toLowerCase();
  if (host !== 'utfs.io' && !UFS_APP_HOST.test(host)) return null;

  const match = /^\/f\/([^/]+)$/.exec(parsed.pathname);
  if (!match) return null;

  const key = match[1];
  if (key === '.' || key === '..' || !FILE_KEY.test(key)) return null;

  return { key };
}

export interface RegisterUploadInput {
  key: string;
  url: string;
  userId: string;
  orderId: string | null;
  purpose: UploadPurpose;
}

/**
 * Records an uploaded file (idempotent by key). The FIRST registration wins:
 * re-registering an existing key never changes its owner, order or purpose, so
 * the registry cannot be used to take over somebody else's file.
 */
export async function registerUpload(input: RegisterUploadInput) {
  const { key, url, userId, orderId, purpose } = input;
  return prisma.uploadedFile.upsert({
    where: { key },
    create: { key, url, userId, orderId, purpose },
    update: {},
  });
}

/** Returns the registry row when `key` is a RECEIPT uploaded by `userId` for `orderId`. */
export async function findRegisteredReceipt(input: {
  key: string;
  userId: string;
  orderId: string;
}) {
  const row = await prisma.uploadedFile.findUnique({ where: { key: input.key } });
  if (
    !row ||
    row.purpose !== 'RECEIPT' ||
    row.userId !== input.userId ||
    row.orderId !== input.orderId
  ) {
    return null;
  }
  return row;
}

/** Escapes LIKE wildcards so the key is matched literally (escape char is `\`). */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * True when the key appears in any other table that can hold an UploadThing
 * URL: Product.images, ProductColor.images, PromoBanner.image, User.image or
 * the receiptUrl of an order other than `exceptOrderId`.
 */
export async function isKeyReferencedElsewhere(
  key: string,
  { exceptOrderId }: { exceptOrderId: string }
): Promise<boolean> {
  const pattern = `%${escapeLike(key)}%`;

  const rows = await prisma.$queryRaw<Array<{ referenced: boolean }>>(Prisma.sql`
    SELECT (
      EXISTS (SELECT 1 FROM "Product" p, unnest(p."images") AS img WHERE img LIKE ${pattern} ESCAPE '\\')
      OR EXISTS (SELECT 1 FROM "ProductColor" c, unnest(c."images") AS img WHERE img LIKE ${pattern} ESCAPE '\\')
      OR EXISTS (SELECT 1 FROM "PromoBanner" b WHERE b."image" LIKE ${pattern} ESCAPE '\\')
      OR EXISTS (SELECT 1 FROM "User" u WHERE u."image" LIKE ${pattern} ESCAPE '\\')
      OR EXISTS (
        SELECT 1 FROM "Order" o
        WHERE o."receiptUrl" LIKE ${pattern} ESCAPE '\\'
          AND o."id" <> ${exceptOrderId}::uuid
      )
    ) AS "referenced"
  `);

  return Boolean(rows[0]?.referenced);
}

export interface DeleteReceiptResult {
  deleted: boolean;
  reason?: string;
}

/**
 * Deletes a receipt file from UploadThing and the registry, but ONLY when the
 * URL is a valid UploadThing URL whose key is registered as a RECEIPT of
 * `orderId` and is not referenced by any other row. Never throws.
 */
export async function deleteRegisteredReceiptFile({
  orderId,
  url,
}: {
  orderId: string;
  url: string;
}): Promise<DeleteReceiptResult> {
  try {
    const parsed = parseUploadThingUrl(url);
    if (!parsed) return { deleted: false, reason: 'invalid_url' };

    const row = await prisma.uploadedFile.findUnique({ where: { key: parsed.key } });
    if (!row) return { deleted: false, reason: 'not_registered' };
    if (row.purpose !== 'RECEIPT') return { deleted: false, reason: 'not_a_receipt' };
    if (row.orderId !== orderId) return { deleted: false, reason: 'other_order' };

    if (await isKeyReferencedElsewhere(parsed.key, { exceptOrderId: orderId })) {
      return { deleted: false, reason: 'referenced_elsewhere' };
    }

    await deleteUTFiles([url]);
    await prisma.uploadedFile.deleteMany({ where: { key: parsed.key } });
    return { deleted: true };
  } catch (error) {
    console.error('[uploads] deleteRegisteredReceiptFile failed:', error);
    return { deleted: false, reason: 'error' };
  }
}
