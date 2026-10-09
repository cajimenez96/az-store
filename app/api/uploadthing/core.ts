import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { authorizeImageUpload, authorizeReceiptUpload } from '@/lib/uploadthing-guards';
import { registerUpload } from '@/lib/uploads/registry';

const f = createUploadthing();

// Both endpoints list explicit MIME types (jpeg, png, webp): SVG and GIF are
// intentionally excluded.

function toUploadThingError(error: unknown): UploadThingError {
  return new UploadThingError(error instanceof Error ? error.message : 'No autorizado');
}

export const ourFileRouter = {
  imageUploader: f({
    'image/jpeg': { maxFileSize: '16MB', maxFileCount: 10 },
    'image/png': { maxFileSize: '16MB', maxFileCount: 10 },
    'image/webp': { maxFileSize: '16MB', maxFileCount: 10 },
  })
    .middleware(async () => {
      const session = await auth();
      try {
        return authorizeImageUpload(session);
      } catch (error) {
        throw toUploadThingError(error);
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await registerUpload({
        key: file.key,
        url: file.ufsUrl,
        userId: metadata.userId,
        orderId: null,
        purpose: 'IMAGE',
      });
      return { uploadedBy: metadata.userId };
    }),

  receiptUploader: f({
    'image/jpeg': { maxFileSize: '8MB', maxFileCount: 1 },
    'image/png': { maxFileSize: '8MB', maxFileCount: 1 },
    'image/webp': { maxFileSize: '8MB', maxFileCount: 1 },
  })
    .input(z.object({ orderId: z.string().uuid() }))
    .middleware(async ({ input }) => {
      const session = await auth();
      try {
        return await authorizeReceiptUpload(session, input.orderId);
      } catch (error) {
        throw toUploadThingError(error);
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await registerUpload({
        key: file.key,
        url: file.ufsUrl,
        userId: metadata.userId,
        orderId: metadata.orderId,
        purpose: 'RECEIPT',
      });
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;
export type OurFileRouter = typeof ourFileRouter;
