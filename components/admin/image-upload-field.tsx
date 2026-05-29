'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useUploadThing } from '@/lib/uploadthing';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Link2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ImageUploadFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}

/**
 * Full-area drag-and-drop image uploader.
 * Supports: click-to-browse, drag & drop (multi-file), and URL input.
 */
export function ImageUploadField({ images, onChange, disabled }: ImageUploadFieldProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const { startUpload, isUploading } = useUploadThing('imageUploader', {
    onClientUploadComplete(res) {
      const newUrls = res.map((r) => r.url);
      onChange([...images, ...newUrls]);
    },
    onUploadError(error) {
      toast({ variant: 'destructive', description: `Error al subir: ${error.message}` });
    },
  });

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      startUpload(Array.from(files));
    },
    [startUpload]
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

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (images.includes(trimmed)) {
      toast({ variant: 'destructive', description: 'Esta URL ya fue agregada.' });
      return;
    }
    onChange([...images, trimmed]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemove = (idx: number) => {
    const next = [...images];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className='space-y-3'>
      {/* Thumbnails grid */}
      {images.length > 0 && (
        <div className='flex flex-wrap gap-3'>
          {images.map((src, idx) => (
            <div key={`${src}-${idx}`} className='relative w-24 h-24 group rounded-az-sm overflow-hidden border border-az-hairline-soft'>
              <Image
                src={src}
                alt={`Imagen ${idx + 1}`}
                fill
                className='object-cover object-center'
                sizes='96px'
              />
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
      {!disabled && (
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
            accept='image/*'
            multiple
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
              <p className='az-caption text-az-ink text-center'>
                Arrastrá imágenes o hacé clic para seleccionar
              </p>
              <p className='az-caption text-az-stone'>PNG, JPG, WEBP — múltiples a la vez</p>
            </>
          )}
        </div>
      )}

      {/* URL input toggle */}
      {!disabled && (
        <div className='space-y-2'>
          {showUrlInput ? (
            <div className='flex gap-2'>
              <Input
                placeholder='https://drive.google.com/uc?export=view&id=...'
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                className='az-body-sm'
              />
              <Button type='button' size='sm' onClick={handleAddUrl} className='shrink-0'>
                Agregar
              </Button>
              <Button
                type='button'
                size='sm'
                variant='ghost'
                onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                className='shrink-0'
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <button
              type='button'
              onClick={() => setShowUrlInput(true)}
              className='flex items-center gap-1.5 az-caption text-az-stone hover:text-az-ink transition-colors'
            >
              <Link2 size={13} />
              Agregar por URL
            </button>
          )}
        </div>
      )}
    </div>
  );
}
