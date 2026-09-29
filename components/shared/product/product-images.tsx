'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const ProductImages = ({ images }: { images: string[] }) => {
  const [current, setCurrent] = useState(0);

  return (
    <div className='flex flex-col md:flex-row gap-3 sm:gap-4'>
      {/* Thumbnail strip — horizontal on mobile, vertical on desktop */}
      {images.length > 1 && (
        <div className='flex md:flex-col gap-2.5 order-2 md:order-1 overflow-x-auto md:overflow-y-auto md:max-h-[600px] scrollbar-none'>
          {images.map((image, index) => (
            <button
              key={image}
              onClick={() => setCurrent(index)}
              className={cn(
                'shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-nike-soft-cloud overflow-hidden border transition-all',
                current === index
                  ? 'border-nike-ink ring-1 ring-nike-ink opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <Image
                src={image}
                alt={`Product view ${index + 1}`}
                width={80}
                height={80}
                className='w-full h-full object-contain p-1.5'
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image stage */}
      <div className='flex-1 order-1 md:order-2'>
        <div className='relative aspect-square bg-nike-soft-cloud overflow-hidden flex items-center justify-center'>
          <Image
            src={images[current]}
            alt='Product image'
            fill
            className='object-contain p-6 sm:p-10'
            sizes='(max-width: 768px) 100vw, 55vw'
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default ProductImages;
