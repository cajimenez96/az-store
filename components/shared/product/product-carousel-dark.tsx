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
      <section className='relative flex items-center justify-center bg-az-ink-deep overflow-hidden pt-24 pb-32 md:pt-32 md:pb-48 min-h-[60vh]'>
        <div className='az-wrapper relative z-10 text-center'>
          <p className='az-caption-bold text-white/60 uppercase tracking-widest mb-6'>Nueva Colección</p>
          <h1 className='az-hero-display text-white mb-8 max-w-4xl mx-auto'>
            Estilo que habla por vos
          </h1>
          <Link
            href='/search'
            className='inline-block bg-white text-az-ink-deep px-8 py-4 rounded-az-full az-button-md hover:bg-az-surface-soft transition-colors duration-150'
          >
            Explorar colección
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className='relative bg-az-ink-deep overflow-hidden'>
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
              <div className='relative w-full min-h-[70vh] md:min-h-[85vh] flex items-end'>
                {/* Full-bleed banner image */}
                <Image
                  src={product.banner!}
                  alt={product.name}
                  fill
                  className='object-cover object-center'
                  priority={index === 0}
                  sizes='100vw'
                />

                {/* Gradient overlay — text reads cleanly over the photo */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40' />

                {/* Text content — sits at bottom left, like a magazine spread */}
                <div className='relative z-10 az-wrapper pb-16 md:pb-24'>
                  <p className='az-caption-bold text-white/60 uppercase tracking-widest mb-4'>Destacado</p>
                  <h1 className='az-heading-md text-white mb-6 max-w-2xl'>
                    {product.name}
                  </h1>
                  <p className='text-white/70 text-base mb-8 max-w-md leading-relaxed'>
                    {product.description}
                  </p>
                  <div className='flex gap-4 flex-wrap'>
                    <Link
                      href={`/product/${product.slug}`}
                      className='bg-white text-az-ink-deep px-8 py-4 rounded-az-full az-button-md hover:bg-az-surface-soft transition-colors duration-150'
                    >
                      Ver producto
                    </Link>
                    <Link
                      href='/search'
                      className='border-2 border-white text-white px-8 py-4 rounded-az-full az-button-md hover:bg-white/10 transition-colors duration-150'
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
        <CarouselPrevious className='left-4 md:left-8 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white' />
        <CarouselNext className='right-4 md:right-8 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white' />
      </Carousel>
    </section>
  );
};

export default ProductCarouselDark;
