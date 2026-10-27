'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const ProductImages = ({ images }: { images: string[] }) => {
  const [selected, setSelected] = useState(0);
  // Clamp: a color change can leave fewer images than the previous index
  const current = selected < images.length ? selected : 0;

  return (
    <div className='flex flex-col md:flex-row gap-3 sm:gap-4'>
      {/* Thumbnail strip — desktop only; mobile swipes the stage instead */}
      {images.length > 1 && (
        <div className='hidden md:flex md:flex-col gap-2.5 md:order-1 overflow-y-auto md:max-h-[600px] scrollbar-none'>
          {images.map((image, index) => (
            <button
              key={image}
              onClick={() => setSelected(index)}
              aria-label={`Ver imagen ${index + 1}`}
              className={cn(
                'shrink-0 w-20 h-20 bg-nike-soft-cloud overflow-hidden border transition-all',
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

      {/* Mobile: swipeable stage with dot indicator */}
      <div className='md:hidden'>
        <div
          className='flex overflow-x-auto snap-x snap-mandatory scrollbar-none'
          onScroll={(e) => {
            const el = e.currentTarget;
            setSelected(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((image, index) => (
            <div
              key={image}
              className='relative aspect-square w-full shrink-0 snap-center bg-nike-soft-cloud'
            >
              <Image
                src={image}
                alt={`Product view ${index + 1}`}
                fill
                className='object-contain p-6'
                sizes='100vw'
                priority={index === 0}
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className='flex justify-center gap-1.5 pt-3' aria-hidden>
            {images.map((image, index) => (
              <span
                key={image}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  current === index ? 'w-4 bg-nike-ink' : 'w-1.5 bg-nike-hairline'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop main image stage */}
      <div className='hidden md:block flex-1 md:order-2'>
        <div className='relative aspect-square bg-nike-soft-cloud overflow-hidden flex items-center justify-center'>
          <Image
            src={images[current]}
            alt='Product image'
            fill
            className='object-contain p-10'
            sizes='55vw'
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default ProductImages;
