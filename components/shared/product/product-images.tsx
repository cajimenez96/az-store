'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const ProductImages = ({ images }: { images: string[] }) => {
  const [current, setCurrent] = useState(0);

  return (
    <div className='flex flex-col md:flex-row gap-4'>
      {/* Thumbnail strip — horizontal on mobile, vertical on desktop */}
      {images.length > 1 && (
        <div className='flex md:flex-col gap-2 order-2 md:order-1 overflow-x-auto md:overflow-y-auto md:max-h-[560px]'>
          {images.map((image, index) => (
            <button
              key={image}
              onClick={() => setCurrent(index)}
              className={cn(
                'shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-az-lg overflow-hidden bg-az-surface-soft border-2 transition-colors duration-150',
                current === index
                  ? 'border-az-ink-deep'
                  : 'border-az-hairline-soft hover:border-az-hairline'
              )}
            >
              <Image
                src={image}
                alt={`Product view ${index + 1}`}
                width={80}
                height={80}
                className='w-full h-full object-contain p-1'
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className='flex-1 order-1 md:order-2'>
        <div className='relative aspect-square rounded-az-xxxl overflow-hidden bg-az-surface-soft'>
          <Image
            src={images[current]}
            alt='Product image'
            fill
            className='object-contain p-6'
            sizes='(max-width: 768px) 100vw, 55vw'
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default ProductImages;
