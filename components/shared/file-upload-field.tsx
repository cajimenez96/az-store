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
          const result = await startUpload([file]);
          if (result && result[0]) {
            uploadedUrls.push(result[0].url);
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
    [startUpload, files, files.length, maxFiles, multiple, onChange, toast]
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
              className='relative w-24 h-24 group rounded-az-sm overflow-hidden border border-az-hairline-soft'
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
                <div className='w-full h-full bg-az-surface-soft flex items-center justify-center text-center p-2'>
                  <div className='az-caption text-az-steel truncate'>{`Archivo ${idx + 1}`}</div>
                </div>
              )}
              {!disabled && (
                <button
                  type='button'
                  onClick={() => handleRemove(idx)}
                  className='absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs'
                >
                  <X size={10} />
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
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={[
            'relative w-full border-2 border-dashed rounded-az-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors select-none',
            isDragging
              ? 'border-az-primary bg-az-primary/5'
              : 'border-az-hairline hover:border-az-primary/50 hover:bg-az-surface-soft',
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
              <Loader2 size={20} className='animate-spin text-az-stone' />
              <p className='az-caption text-az-stone'>Subiendo...</p>
            </>
          ) : (
            <>
              <Plus size={20} className='text-az-stone' />
              <p className='az-caption text-az-ink text-center'>{placeholder}</p>
              {description && <p className='az-caption text-az-stone'>{description}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
