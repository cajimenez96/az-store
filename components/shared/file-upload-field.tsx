'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useUploadThing } from '@/lib/uploadthing';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UploadEndpoint = 'imageUploader' | 'receiptUploader';

interface FileUploadFieldProps {
  files: string[];
  onChange: (files: string[]) => void;
  disabled?: boolean;
  endpoint: UploadEndpoint;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  placeholder?: string;
  description?: string;
  fileType?: 'image' | 'document';
  /**
   * Input forwarded to the upload endpoint. `receiptUploader` requires
   * `{ orderId }` (validated server-side); `imageUploader` takes no input.
   */
  uploadInput?: { orderId: string };
}

export function FileUploadField({
  files,
  onChange,
  disabled = false,
  endpoint,
  accept = 'image/*',
  multiple = true,
  maxFiles = 10,
  placeholder = 'Arrastrá archivos o hacé clic para seleccionar',
  description,
  fileType = 'image',
  uploadInput,
}: FileUploadFieldProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { startUpload, isUploading } = useUploadThing(endpoint);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const remaining = maxFiles - files.length;
      if (remaining <= 0) {
        toast({
          variant: 'destructive',
          description: `Máximo de archivos alcanzado (${maxFiles})`,
        });
        return;
      }

      const filesToUpload = Array.from(fileList).slice(0, remaining);
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        try {
          // `endpoint` is a union, so the generated `startUpload` input type
          // collapses to `undefined` (imageUploader) & `{ orderId }`
          // (receiptUploader). The server validates the input per endpoint,
          // hence the cast.
          const result = await startUpload([file], uploadInput as never);
          if (result && result[0]) {
            // Keep the `utfs.io` form (`url`) first: next.config only allows that host
            // for next/image, so preferring `ufsUrl` (`<appid>.ufs.sh`) would break the
            // rendering of admin images. `url` is deprecated and removed in uploadthing
            // v9; then switch to `ufsUrl` and add `*.ufs.sh` to `remotePatterns`.
            uploadedUrls.push(result[0].url ?? result[0].ufsUrl);
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            description: `Error al subir archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          });
          return;
        }
      }

      if (multiple) {
        onChange([...files, ...uploadedUrls]);
      } else {
        onChange([uploadedUrls[0]]);
      }

      if (uploadedUrls.length > 0) {
        toast({
          description: `${uploadedUrls.length} archivo${uploadedUrls.length > 1 ? 's' : ''} subido${uploadedUrls.length > 1 ? 's' : ''} exitosamente`,
        });
      }
    },
    [startUpload, uploadInput, files, files.length, maxFiles, multiple, onChange, toast]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (idx: number) => {
    const next = [...files];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className='space-y-3'>
      {/* Thumbnails grid */}
      {files.length > 0 && (
        <div className='flex flex-wrap gap-3'>
          {files.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className='relative w-24 h-24 group rounded-nike-sm overflow-hidden border border-nike-hairline-soft bg-nike-soft-cloud'
            >
              {fileType === 'image' ? (
                <Image
                  src={src}
                  alt={`Archivo ${idx + 1}`}
                  fill
                  className='object-cover object-center'
                  sizes='96px'
                />
              ) : (
                <div className='w-full h-full bg-nike-soft-cloud flex items-center justify-center text-center p-2'>
                  <div className='text-xs font-medium text-nike-mute truncate'>{`Archivo ${idx + 1}`}</div>
                </div>
              )}
              {!disabled && (
                <button
                  type='button'
                  onClick={() => handleRemove(idx)}
                  aria-label={`Quitar archivo ${idx + 1}`}
                  className='absolute top-1 right-1 bg-nike-canvas text-nike-ink border border-nike-hairline w-8 h-8 rounded-nike-full flex items-center justify-center hover:bg-nike-soft-cloud focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nike-ink transition-colors'
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {!disabled && files.length < maxFiles && (
        <div
          role='button'
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            'relative w-full min-h-[44px] border border-dashed rounded-nike-md p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors select-none',
            isDragging
              ? 'border-nike-ink bg-nike-soft-cloud'
              : 'border-nike-hairline bg-nike-canvas hover:bg-nike-soft-cloud',
            'focus-visible:outline-none focus-visible:border-nike-ink focus-visible:ring-4 focus-visible:ring-nike-soft-cloud',
          ].join(' ')}
        >
          <input
            ref={inputRef}
            type='file'
            accept={accept}
            multiple={multiple}
            className='sr-only'
            onChange={(e) => handleFiles(e.target.files)}
          />

          {isUploading ? (
            <>
              <Loader2 size={20} className='animate-spin text-nike-mute' />
              <p className='text-sm font-medium text-nike-mute'>Subiendo...</p>
            </>
          ) : (
            <>
              <Plus size={20} className='text-nike-mute' />
              <p className='text-sm font-medium text-nike-ink text-center'>{placeholder}</p>
              {description && <p className='text-xs font-medium text-nike-mute text-center'>{description}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
