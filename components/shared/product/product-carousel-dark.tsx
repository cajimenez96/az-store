'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Product } from '@/types';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import Image from 'next/image';

const ProductCarouselDark = ({ data }: { data: Product[] }) => {
  const featuredWithBanner = data.filter((product) => product.banner);

  if (featuredWithBanner.length === 0) {
    // Fallback hero when no featured products with banners exist
    return (
      <section className='relative flex items-center justify-center bg-nike-ink overflow-hidden pt-24 pb-32 md:pt-32 md:pb-48 min-h-[70vh]'>
        <div className='max-w-[1440px] mx-auto px-6 relative z-10 text-center'>
          <p className='font-sans text-xs sm:text-sm font-semibold text-white/70 uppercase tracking-widest mb-4'>
            Nueva Colección
          </p>
          <h1 className='font-nike-display text-5xl sm:text-7xl md:text-8xl lg:text-[96px] leading-[0.9] text-white uppercase mb-6 max-w-4xl mx-auto'>
            Estilo que habla por vos
          </h1>
          <Link
            href='/search'
            className='inline-flex items-center justify-center bg-white text-nike-ink px-8 py-3.5 rounded-full text-base font-medium hover:bg-nike-soft-cloud active:scale-95 transition-all shadow-sm'
          >
            Explorar colección
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className='relative bg-nike-ink overflow-hidden'>
      <Carousel
        className='w-full'
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: 8000,
            stopOnInteraction: true,
            stopOnMouseEnter: true,
          }),
        ]}
      >
        <CarouselContent>
          {featuredWithBanner.map((product: Product, index: number) => (
            <CarouselItem key={product.id}>
              <div className='relative w-full min-h-[75vh] md:min-h-[90vh] flex items-end'>
                {/* Full-bleed banner image */}
                <Image
                  src={product.banner!}
                  alt={product.name}
                  fill
                  className='object-cover object-center'
                  priority={index === 0}
                  sizes='100vw'
                />

                {/* Editorial gradient overlay */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20' />

                {/* Text content */}
                <div className='relative z-10 max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 w-full pb-16 md:pb-24'>
                  <p className='font-sans text-xs sm:text-sm font-semibold text-white/70 uppercase tracking-widest mb-2'>
                    Destacado
                  </p>
                  <h1 className='font-nike-display text-5xl sm:text-7xl md:text-8xl lg:text-[96px] leading-[0.9] uppercase tracking-tight text-white mb-3 max-w-4xl drop-shadow-md'>
                    {product.name}
                  </h1>
                  {product.description && (
                    <p className='font-sans text-white/90 text-base md:text-lg mb-8 max-w-xl leading-relaxed font-normal'>
                      {product.description}
                    </p>
                  )}
                  <div className='flex gap-3 flex-wrap items-center'>
                    <Link
                      href={`/product/${product.slug}`}
                      className='inline-flex items-center justify-center bg-white text-nike-ink px-8 py-3.5 rounded-full text-base font-medium hover:bg-nike-soft-cloud active:scale-95 transition-all shadow-sm'
                    >
                      Ver producto
                    </Link>
                    <Link
                      href='/search'
                      className='inline-flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/40 text-white px-8 py-3.5 rounded-full text-base font-medium hover:bg-white/30 active:scale-95 transition-all'
                    >
                      Ver colección
                    </Link>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Nav arrows */}
        <CarouselPrevious className='left-4 md:left-8 bg-white/80 hover:bg-white text-nike-ink border-0 h-11 w-11 shadow-md' />
        <CarouselNext className='right-4 md:right-8 bg-white/80 hover:bg-white text-nike-ink border-0 h-11 w-11 shadow-md' />
      </Carousel>
    </section>
  );
};

export default ProductCarouselDark;
